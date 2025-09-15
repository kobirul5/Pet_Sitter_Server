import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { ServiceType } from "@prisma/client";
import { serviceReuestService } from "./serviceReuest.service";

// Create client request
const createClientRequestController = catchAsync(async (req: Request, res: Response) => {
  const clientId = req.user.id;
  const { sitterId, startTime, endTime, serviceType, price, totalPrice, dogIds } = req.body;

  if (!sitterId || !startTime || !endTime || !price || !totalPrice || !dogIds?.length) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Missing required fields" });
  }

  const allowedServices = [ServiceType.BOARDING, ServiceType.DAYCARE, ServiceType.WALKING];
  if (!allowedServices.includes(serviceType)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Service type must be one of: ${allowedServices.join(", ")}`);
  }

  const newRequest = await serviceReuestService.createClientRequestService({
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
    const requests = await serviceReuestService.getServiceRequests();
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
    const requests = await serviceReuestService.getServiceForSitterRequests(
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

//updateServicestatusController
const updateServicestatusController = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId, status } = req.body;
    const sitterId = req.user.id;
    const result = await serviceReuestService.updateServicestatus(
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

// get clinet and dog details
const getClinetAndDogProfileByIdController = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.requestid;
    const result = await serviceReuestService.getClinetAndDogProfileById(
      requestId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "get clinet and dog details successfully",
      data: result,
    });
  }
);

const acceptClinerRequestController = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.id;

    const sitterId = req.user.id;

    const result = await serviceReuestService.acceptClinerRequest(
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

// createReviewCinetAndDogController
const createReviewCinetAndDogController = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId, client, dog } = req.body;

    const result = await serviceReuestService.createReviewCinetAndDog({
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
    const result = await serviceReuestService.getAllAcceptedRequests(sitterId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Service requests retrieved successfully",
      data: result,
    });
  }
);

// getAllUpcomingAndOngoingCleintRequests
const getAllUpcomingAndOngoingCleintRequests = catchAsync(
  async (req: Request, res: Response) => {
    const sitterId = req.user.id;
    const result =
      await serviceReuestService.getAllUpcomingAndOngoingCleintServices(
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
    const result = await serviceReuestService.getAcceptServiceForPayment(
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

const denyClinerRequestController = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const clientId = req.user.id;
    const result = await serviceReuestService.denyClinerRequest(
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

export const serviceReuestController = {
  createClientRequestController,
  getServiceRequestsController,
  getServiceRequestsForSitterController,
  updateServicestatusController,
  getClinetAndDogProfileByIdController,
  acceptClinerRequestController,
  createReviewCinetAndDogController,
  getAllAcceptedRequests,
  getAllUpcomingAndOngoingCleintRequests,
  getAcceptServiceForPaymentController,
  denyClinerRequestController,
};
