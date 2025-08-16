import { PaymenttStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { getTransactionId } from "../../../helpars/getTransactionId";
import prisma from "../../../shared/prisma";
import stripe from "../../../shared/stripe";
import httpStatus from "http-status";

const createPaymentIntent = async ({
  requestId,
  methodCardId,
  userId,
  currency,
  // amount
}: {
  requestId: string;
  userId: string;
  currency?: string;
  methodCardId: string
  // amount: number
}) => {
  const transactionId = getTransactionId();

  const request = await prisma.clientRequest.findUnique({
    where: {
      id: requestId,
      status: PaymenttStatus.ACCEPTED,
    },
    include: {
      client: true,
      sitter: true,
      Payment: true,
    },
  });

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client Service request not found')
  };

  try {

  const result = await prisma.$transaction(async (tx) => {
      // Create a Payment record in DB
      const payment = await tx.payment.create({
        data: {
          requestId,
          amount: request.totalPrice,
          methodCardId,
          currency: currency || "USD",
          paymentStatus: PaymenttStatus.PENDING,
          transactionId,
          method: "CARD",
        },
      });

      // Create Stripe PaymentIntent 
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.totalPrice * 100), // convert to cents
        currency: currency || "USD",
        receipt_email: request.client.email,
        payment_method: payment.methodCardId,
        off_session: true,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          requestId: request.id,
          transactionId,
          userId,
        },
      });

      console.log("PaymentIntent created:", paymentIntent);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment,
      };
    });

    return result;
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment intent");
  }
};



// get my payments
const getMyPayments = async (userId: string) => {
  const result = await prisma.payment.findMany({
    where: {

    },
  });
  return result;
}

export const paymentService = {
  createPaymentIntent,
};