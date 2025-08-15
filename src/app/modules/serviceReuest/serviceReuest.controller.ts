import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { ServiceType } from "@prisma/client";
import { serviceReuestService } from "./serviceReuest.service";

// Create client request
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

// Get all service requests
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
// Get service requests by siiterId for sitter
const getServiceRequestsForSitterController = catchAsync(
  async (req: Request, res: Response) => {

    const sitterId = req.user.id
    console.log(sitterId)
    const requests = await serviceReuestService.getServiceForSitterRequests(sitterId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Service requests retrieved successfully',
      data: requests,
    });
  }
);


//updateServicestatusController
const updateServicestatusController = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId, status } = req.body
    const sitterId = req.user.id
    const result = await serviceReuestService.updateServicestatus(requestId, status, sitterId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Service status updated successfully',
      data: result,
    });
  }
)

// get clinet and dog details
const getClinetAndDogProfileByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId } = req.body
    const result = await serviceReuestService.getClinetAndDogProfileById(requestId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Service status updated successfully',
      data: result,
    });
  }
)

const acceptClinerRequestController = catchAsync(
  async (req: Request, res: Response) => {
    const  requestId  = req.params.id

    const sitterId = req.user.id

    const result = await serviceReuestService.acceptClinerRequest(requestId, sitterId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Service status updated successfully',
      data: result,
    });
  }
)

//


export const serviceReuestController = {
  createClientRequestController,
  getServiceRequestsController,
  getServiceRequestsForSitterController,
  updateServicestatusController,
  getClinetAndDogProfileByIdController,
  acceptClinerRequestController
};