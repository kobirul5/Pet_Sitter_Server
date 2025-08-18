import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { paymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';
import { handleStripeWebhook } from './payment.webhook';

const router = express.Router();

router.post(
'/',
auth(), 
// validateRequest(paymentValidation.createSchema),
paymentController.createPayment,
);

router.post(
  "/create-card",
  auth(),
  // validateRequest(paymentValidation.createCardSchema),
  paymentController.createCard
)

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

router.get("/get-all-payments", auth(), paymentController.getAllPayment);

router.get("/get-my-payments", auth(), paymentController.getMyPayments);


export const paymentRoutes = router;