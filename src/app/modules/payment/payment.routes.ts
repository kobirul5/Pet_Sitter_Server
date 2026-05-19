import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { paymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';
import { handleStripeWebhook } from './payment.webhook';
import { UserRole } from '@prisma/client';

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

router.get(
  "/stripe-connect-accounts",
  // auth(UserRole.Admin),
  paymentController.getAllStripeConnectAccounts
);

router.get(
  "/stripe-transactions",
  // auth(UserRole.Admin),
  paymentController.getStripeTransactions
);

//
router.post(
  "/create-stripe-account",
  auth(UserRole.Sitter),
  paymentController.createStripeAccount
);
router.get("/check-stripe-status", auth(UserRole.Sitter), paymentController.checkStripeAccountStatus);
router.get("/dashboard-link", auth(UserRole.Sitter), paymentController.getTaskerDashboardLink);
router.patch("/release-fund/:requestId", auth(UserRole.Sitter), paymentController.releaseSitterFund);



export const paymentRoutes = router;
