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