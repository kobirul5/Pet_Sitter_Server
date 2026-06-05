import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { ServiceType } from "@prisma/client";
import { serviceRequestService } from "./serviceRequest.service";

// Create client request
const createClientRequestController = catchAsync(async (req: Request, res: Response) => {
  const clientId = req.user.id;
  const { sitterId, startTime, endTime, serviceType, price, totalPrice, dogIds } = req.body;

  if (!sitterId || !startTime  || !price || !totalPrice || !dogIds?.length) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Missing required fields" });
  }

  const allowedServices = [ServiceType.BOARDING, ServiceType.DAYCARE, ServiceType.WALKING];
  if (!allowedServices.includes(serviceType)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Service type must be one of: ${allowedServices.join(", ")}`);
  }

  const newRequest = await serviceRequestService.createClientRequestService({
    clientId,
    sitterId,
    startTime,
    endTime,
    serviceType,
    price: price,
    totalPrice,
    dogIds,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Client request created successfully",
    data: newRequest,
  });
});


// Get all service requests
const getServiceRequestsController = catchAsync(
  async (req: Request, res: Response) => {
    const requests = await serviceRequestService.getServiceRequests();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests retrieved successfully",
      data: requests,
    });
  }
);
// Get service requests by siiterId for sitter
const getServiceRequestsForSitterController = catchAsync(
  async (req: Request, res: Response) => {
    console.log("hey");

    const sitterId = req.user.id;
    const requests = await serviceRequestService.getServiceForSitterRequests(
      sitterId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests retrieved successfully",
      data: requests,
    });
  }
);

//updateServiceStatusController
const updateServiceStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId, status } = req.body;
    const sitterId = req.user.id;
    const result = await serviceRequestService.updateServiceStatus(
      requestId,
      status,
      sitterId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service status updated successfully",
      data: result,
    });
  }
);

// get client and dog details
const getClientAndDogProfileByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.requestid;
    const result = await serviceRequestService.getClientAndDogProfileById(
      requestId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "get client and dog details successfully",
      data: result,
    });
  }
);

const acceptClientRequestController = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.id;

    const sitterId = req.user.id;

    const result = await serviceRequestService.acceptClientRequest(
      requestId,
      sitterId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service status updated successfully",
      data: result,
    });
  }
);

// createReviewClientAndDogController
const createReviewClientAndDogController = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId, client, dog } = req.body;

    const result = await serviceRequestService.createReviewClientAndDog({
      requestId,
      client,
      dog,
    });
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review created successfully",
      data: result,
    });
  }
);

const getAllAcceptedRequests = catchAsync(
  async (req: Request, res: Response) => {
    const sitterId = req.user.id;
    const result = await serviceRequestService.getAllAcceptedRequests(sitterId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests retrieved successfully",
      data: result,
    });
  }
);

// getAllUpcomingAndOngoingClientRequests
const getAllUpcomingAndOngoingClientRequests = catchAsync(
  async (req: Request, res: Response) => {
    const sitterId = req.user.id;
    const result =
      await serviceRequestService.getAllUpcomingAndOngoingClientServices(
        sitterId
      );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests retrieved successfully",
      data: result,
    });
  }
);

// Get all service requests payment
const getAcceptServiceForPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const clientId = req.user.id;
    const result = await serviceRequestService.getAcceptServiceForPayment(
      clientId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests retrieved successfully",
      data: result,
    });
  }
);

const denyClientRequestController = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const clientId = req.user.id;
    const result = await serviceRequestService.denyClientRequest(
      requestId,
      clientId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service status updated successfully",
      data: result,
    });
  }
);

export const serviceRequestController = {
  createClientRequestController,
  getServiceRequestsController,
  getServiceRequestsForSitterController,
  updateServiceStatusController,
  getClientAndDogProfileByIdController,
  acceptClientRequestController,
  createReviewClientAndDogController,
  getAllAcceptedRequests,
  getAllUpcomingAndOngoingClientRequests,
  getAcceptServiceForPaymentController,
  denyClientRequestController,
};
