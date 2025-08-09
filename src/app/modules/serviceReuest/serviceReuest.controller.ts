import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { ServiceType } from "@prisma/client";
import { serviceReuestService } from "./serviceReuest.service";

const createClientRequestController = catchAsync(
  async (req: Request, res: Response) => {

    const clientId = req.user.id


    const {
      sitterId,
      startTime,
      endTime,
      serviceType,
      hourlyRate,
      currency,
      totalPrice,
      dogId
    } = req.body;

    if (
      !sitterId ||
      !startTime ||
      !endTime ||
      !hourlyRate ||
      !totalPrice ||
      !dogId
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const allowedServiceTypes = [
      ServiceType.BOARDING,
      ServiceType.DOGCARE,
      ServiceType.WALKING,
    ];

    if (!allowedServiceTypes.includes(serviceType)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Service type ${ServiceType.BOARDING} or  ${ServiceType.DOGCARE} or  ${ServiceType.WALKING}`);
    }



    const newRequest = await serviceReuestService.createClientRequestService({
      clientId, endTime, hourlyRate, serviceType, sitterId, startTime, totalPrice, currency, dogId
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Client request created successfully',
      data: newRequest,
    });
  }
);

const getServiceRequestsController = catchAsync(
  async (req: Request, res: Response) => {
    const requests = await serviceReuestService.getServiceRequests();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Service requests retrieved successfully',
      data: requests,
    });
  }
);

export const serviceReuestController = {
  createClientRequestController,
  getServiceRequestsController
};