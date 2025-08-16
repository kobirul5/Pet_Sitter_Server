// stripeWebhook.handler.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { PaymenttStatus } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(" Webhook signature verification failed:", err.message);
    return res
      .status(httpStatus.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { transactionId } = paymentIntent.metadata;

        await prisma.payment.updateMany({
          where: { transactionId },
          data: { paymentStatus: PaymenttStatus.COMPLETED },
        });

        console.log(`Payment successful for transactionId: ${transactionId}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { transactionId } = paymentIntent.metadata;

        await prisma.payment.updateMany({
          where: { transactionId },
          data: { paymentStatus: PaymenttStatus.FAILED },
        });

        console.log(` Payment failed for transactionId: ${transactionId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200); // acknowledge receipt
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
