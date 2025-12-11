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

//
const createStripeAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    // const decodedToken = jwtHelpers.verifyToken(token!, config.jwt.jwt_secret!);

    const accountLink = await paymentService.createStripeAccount(token!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe account creation link generated",
      data: { url: accountLink },
    });
  }
);


const getTaskerDashboardLink = catchAsync(async (req, res) => {
  const result = await paymentService.getTaskerDashboardLink(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tasker dashboard link generated",
    data: result,
  });
});

const releaseSitterFund = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const transfer = await paymentService.releaseSitterFund(req.user.id, requestId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tasker fund released successfully",
    data: transfer,
  });
});

// check stripe account status
const checkStripeAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await paymentService.checkStripeAccountStatus(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Stripe account status",
    data: status,
  });
});

export const paymentController = {
  createPayment,
  createCard,
  getAllPayment,
  getMyPayments,
  createStripeAccount,
  getTaskerDashboardLink,
  releaseSitterFund,
  checkStripeAccountStatus

};