import { NotificationType, PaymenttStatus, RequestStatus, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { getTransactionId } from "../../../helpars/getTransactionId";
import prisma from "../../../shared/prisma";
import stripe from "../../../shared/stripe";
import httpStatus from "http-status";
import { notificationService } from "../notification/notification.service";


interface IPaymentIntent {
  paymentMethod: string;
  requestId: string;
  currency?: string;
  userId: string;
}


const createPaymentIntent = async ({
  paymentMethod,
  requestId,
  currency = 'usd',
  userId,
}: IPaymentIntent) => {
  const transactionId = getTransactionId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const clientRequest = await prisma.clientRequest.findUnique({
    where: { id: requestId },
    include: {
      client: true,
      sitter: true,
    },
  });


  if (!clientRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service request not found");
  }

  if (clientRequest.status !== RequestStatus.ACCEPTED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service request is not Accepted");
  }

  if (clientRequest.paymentStatus === PaymenttStatus.COMPLETED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment already completed");
  }

  try {
    // Stripe payment create
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(clientRequest.totalPrice! * 100), // convert to cents
      currency,
      payment_method: paymentMethod,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        requestId,
        transactionId,
        senderId: userId,
        amount: clientRequest.totalPrice!.toString(),
      },
    });

    if (paymentIntent.status !== 'succeeded') {

      await prisma.payment.create({
        data: {
          transactionId,
          requestId,
          amount: clientRequest.totalPrice!,
          paymentStatus: PaymenttStatus.FAILED,
          senderId: userId,
          method: "CARD",
          methodCardId: paymentIntent.payment_method as string,
        },
      });

      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment failed');
    }



    // Prisma transaction
    const payment = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.payment.create({
        data: {
          transactionId,
          requestId,
          amount: clientRequest.totalPrice!,
          paymentStatus: PaymenttStatus.COMPLETED,
          senderId: userId,
          method: "CARD",
          methodCardId: paymentIntent.payment_method as string,
        },
      });

      await tx.clientRequest.update({
        where: { id: requestId },
        data: {
          paymentStatus: PaymenttStatus.COMPLETED,
        },
      });


      let room = await prisma.room.findFirst({
        where: {
          OR: [
            { senderId: clientRequest.clientId, receiverId: clientRequest.sitterId },
            { senderId: clientRequest.sitterId, receiverId: clientRequest.clientId },
          ],
        },
      });

      if (!room) {
        room = await prisma.room.create({
          data: { senderId: clientRequest.clientId, receiverId: clientRequest.sitterId },
        });
      }

      const chat = await prisma.chat.create({
        data: {
          senderId: clientRequest.clientId,
          receiverId: clientRequest.sitterId,
          roomId: room.id,
          message: `I have successfully completed the payment for the ${clientRequest.serviceType} service. Thank you! If you  want to discuss any details, feel free to reach out.`,
        },
      });

      const payload = {
            title: `Payment Completed for ${clientRequest.serviceType}`,
            body: `The payment for your ${clientRequest.serviceType} request by ${clientRequest.client.firstName + ' ' + clientRequest.client.lastName} has been successfully completed.`
            ,
            type: NotificationType.PAYMENT,
            data: JSON.stringify({
              requestId: clientRequest.id,
              sitterId: clientRequest.sitterId,
            }),
            receiverId: clientRequest.sitter.id
          }

      if (clientRequest.sitter?.fcmToken) {
        await notificationService.sendNotification(
          clientRequest.sitter?.fcmToken,
          payload,
          clientRequest.clientId
        );
      }

      //save notification to the courier
      await notificationService.saveNotification(
        payload,
        clientRequest.client.id
      );



      return paymentRecord;
    });

    return payment;
  } catch (error: any) {
    console.error('Card payment error:', error);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Payment failed');
  }
};


interface ICreateCardRequest {
  payment_method: string;
  isDefault: boolean;
}
// create card
const createCard = async (
  userId: string,
  { payment_method, isDefault }: ICreateCardRequest
) => {
  try {



    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        savedCards: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Create Stripe customer if not exists
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName + " " + user.lastName || undefined,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      user.stripeCustomerId = customer.id;
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(payment_method, {
      customer: user.stripeCustomerId,
    });

    // Save card details
    const card = await prisma.savedCard.create({
      data: {
        userId: user.id,
        cardType: paymentMethod.card!.brand,
        last4: paymentMethod.card!.last4,
        expiryMonth: paymentMethod.card!.exp_month,
        expiryYear: paymentMethod.card!.exp_year,
        stripePaymentMethodId: paymentMethod.id,
        isDefault: isDefault || user.savedCards.length === 0,
      },
    });

    // If this card is set as default, update other cards
    if (card.isDefault) {
      await prisma.savedCard.updateMany({
        where: {
          userId: user.id,
          id: { not: card.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    return card;
  } catch (error) {
    console.error("Create card error:", error);
    throw error;
  }
};


const getAllPayments = async (userId: string) => {

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  })

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== UserRole.Admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only admin can get all payments");
  }


  const result = await prisma.payment.findMany();
  return result;
}


const getMyPayments = async (userId: string) => {

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  })

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.payment.findMany({
    where: {
      senderId: userId
    },
  });
  return result;
}

export const paymentService = {
  createPaymentIntent,
  createCard,
  getAllPayments,
  getMyPayments
};