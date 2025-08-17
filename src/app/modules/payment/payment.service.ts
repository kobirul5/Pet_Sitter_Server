import { PaymenttStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { getTransactionId } from "../../../helpars/getTransactionId";
import prisma from "../../../shared/prisma";
import stripe from "../../../shared/stripe";
import httpStatus from "http-status";


interface IPaymentIntent {
  paymentMethod: string;
  requestId: string;
  currency?: string;
  userId: string;
}


const createPaymentIntent = async ({ paymentMethod, requestId, currency = 'usd', userId,}: IPaymentIntent) => {

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



  try {


    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(clientRequest?.totalPrice! * 100), // convert to cents
      currency,
      payment_method: paymentMethod, // Stripe PaymentMethod ID
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        requestId,
        orderId: transactionId,
        senderId: userId,
        courierId: clientRequest?.sitterId!,
      },
    });

    console.log("paymentIntent", paymentIntent, "-------------------");

    return { paymentIntent };
  } catch (error: any) {
    console.error('Card payment error:', error);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Payment failed');
  }
}


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




const getMyPayments = async (userId: string) => {
  const result = await prisma.payment.findMany({
    where: {

    },
  });
  return result;
}

export const paymentService = {
  createPaymentIntent,
  createCard,
};