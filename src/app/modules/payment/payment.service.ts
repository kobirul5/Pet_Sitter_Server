
import { PaymenttStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { getTransactionId } from "../../../helpars/getTransactionId";
import prisma from "../../../shared/prisma";
import stripe from "../../../shared/stripe";
import httpStatus from "http-status";

const createPaymentIntent = async ({
  requestId,
  userId,
}: {
  requestId: string;
  userId: string;
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
          requestId: request.clientId,
          amount: request.totalPrice,
          currency: 'USD',
          paymentStatus: PaymenttStatus.PENDING,
          transactionId,
          method: "CARD"
        },
      });

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.totalPrice * 100), // convert to cents
        currency: 'usd',
        receipt_email: request.client.email,
        metadata: {
          requestId: request.id,
          transactionId,
          userId,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment,
      };
    });

    return result;
  } catch (error) {
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