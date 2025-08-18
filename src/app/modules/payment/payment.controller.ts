import httpStatus from 'http-status';
import { paymentService } from './payment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NextFunction, Request, Response } from 'express';

const createPayment = catchAsync(async (req, res) => {
  const { paymentMethod, requestId, currency = 'usd', clientId, sitterId, totalPrice } = req.body;
  const userId = req.user.id;

  const result = await paymentService.createPaymentIntent({
    paymentMethod,
    requestId,
    currency,
    userId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment created successfully',
    data: result,
  });
});


const createCard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const result = await paymentService.createCard(userId, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Card saved successfully",
      data: result,
    });
  }
);


const getAllPayment = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await paymentService.getAllPayments(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

const getMyPayments = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await paymentService.getMyPayments(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});


export const paymentController = {
  createPayment,
  createCard,
  getAllPayment,
  getMyPayments

};