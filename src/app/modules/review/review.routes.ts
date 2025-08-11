import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { reviewController } from './review.controller';
import { reviewValidation } from './review.validation';

const router = express.Router();

router.post(
'/review-client-and-dog',
auth(),
// validateRequest(reviewValidation.createSchema),
reviewController.createReviewClinetAndDog,
);


export const reviewRoutes = router;