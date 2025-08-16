import httpStatus from 'http-status';
import { paymentService } from './payment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const createPayment = catchAsync(async (req, res) => {
  const {
    // amount,
    methodCardId,
    currency = 'USD',
    userId,
  requestId} = req.body
  // const userId = req.user.id;
  console.log(userId)
  const result = await paymentService.createPaymentIntent({ methodCardId,currency, requestId, userId});
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment created successfully',
    data: result,
  });
});




export const paymentController = {
  createPayment,

};