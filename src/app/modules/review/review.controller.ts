
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { reviewService } from './review.service';

const createReviewClinetAndDog = catchAsync(async (req, res) => {
  const {
    petData,
    clientData,
  } = req.body;

  const result = await reviewService.createIntoDb({ petData, clientData , sitterId: req.user.id });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});



export const reviewController = {
  createReviewClinetAndDog,
};