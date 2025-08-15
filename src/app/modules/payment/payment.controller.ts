import httpStatus from 'http-status';
import { paymentService } from './payment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const createPayment = catchAsync(async (req, res) => {
  const result = await paymentService.createPaymentIntent(req.body);
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