import { Request, Response } from "express";
import httpStatus from "http-status";
import { SitterService } from "./sitter.service";
import { ISitterFilters, ICreateRating } from "./sitter.interface";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { ServiceType } from "@prisma/client";

// Get sitter recommendations
const getSitterRecommendations = catchAsync(
  async (req: Request, res: Response) => {
    const userToken = req.headers.authorization as string;
    const filters: ISitterFilters = req.query;
    const userID = req.user.id;
    const result = await SitterService.getSitterRecommendations(
      userID,
      filters
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sitter recommendations retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

// Get all services
const getAllSitterForServices = catchAsync(
  async (req: Request, res: Response) => {

    const services = await SitterService.getAllServices();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  }
)


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
    } = req.body;

    if (
      !sitterId ||
      !startTime ||
      !endTime ||
      !hourlyRate ||
      !totalPrice
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



    const newRequest = await SitterService.createClientRequestService({
      clientId, endTime, hourlyRate, serviceType, sitterId, startTime, totalPrice, currency
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Client request created successfully',
      data: newRequest,
    });
  }
);


// Get sitter details by ID
const getSitterDetails = catchAsync(
  async (req: Request, res: Response) => {
    const userToken = req.headers.authorization as string;
    const { sitterId } = req.params;

    const result = await SitterService.getSitterDetails(userToken, sitterId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sitter details retrieved successfully",
      data: result,
    });
  }
);

// Rate a sitter
const rateSitter = catchAsync(
  async (req: Request, res: Response) => {
    const userToken = req.headers.authorization as string;
    const ratingData: ICreateRating = req.body;

    const result = await SitterService.rateSitter(userToken, ratingData);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Sitter rated successfully",
      data: result,
    });
  }
);

// Update sitter rating
const updateSitterRating = catchAsync(
  async (req: Request, res: Response) => {
    const userToken = req.headers.authorization as string;
    const { sitterId } = req.params;
    const ratingData = req.body;

    const result = await SitterService.updateSitterRating(
      userToken,
      sitterId,
      ratingData
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sitter rating updated successfully",
      data: result,
    });
  }
);

// Delete sitter rating
const deleteSitterRating = catchAsync(
  async (req: Request, res: Response) => {
    const userToken = req.headers.authorization as string;
    const { sitterId } = req.params;

    const result = await SitterService.deleteSitterRating(userToken, sitterId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sitter rating deleted successfully",
      data: result,
    });
  }
);

// Get user's ratings
const getUserRatings = catchAsync(
  async (req: Request, res: Response) => {
    const userToken = req.headers.authorization as string;

    const result = await SitterService.getUserRatings(userToken);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User ratings retrieved successfully",
      data: result,
    });
  }
);



export { createClientRequestController };




export const SitterController = {
  getSitterRecommendations,
  getSitterDetails,
  rateSitter,
  updateSitterRating,
  deleteSitterRating,
  getUserRatings,
  getAllSitterForServices,
  createClientRequestController
}; 