import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { paymentController } from './payment.controller';
import { paymentValidation } from './payment.validation';

const router = express.Router();

router.post(
'/',
// auth(),
// validateRequest(paymentValidation.createSchema),
paymentController.createPayment,
);


export const paymentRoutes = router;