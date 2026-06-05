import express from 'express';
import auth from '../../middlewares/auth';
import { reviewController } from './review.controller';
const router = express.Router();

router.post(
'/review-client-and-dog',
auth(),
// validateRequest(reviewValidation.createSchema),
reviewController.createReviewClientAndDog,
);

router.post(
'/review-sitter',
auth(),
// validateRequest(reviewValidation.createSchema),
reviewController.createReviewSitter,
);

 router.get(
'/:id',
auth(),
reviewController.getUserOrSitterReviews,
);

export const reviewRoutes = router;
