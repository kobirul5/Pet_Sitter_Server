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

    const clientId = req.user.id
     const searchText = req.query.search as string | undefined;

    const services = await SitterService.getAllServices(clientId, searchText);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Services retrieved successfully",
      data: services,
    });
  }
)




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
    const userId = req.user.id;
    const ratingData: ICreateRating = req.body;

    const result = await SitterService.rateSitter(userId, ratingData);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Sitter rated successfully",
      data: result,
    });
  }
);


//  get sitter services
const getSitterServicesForBoarding = catchAsync(
  async (req: Request, res: Response) => {
    const clientId = req.user.id
    const searchText = req.query.search as string | undefined;
    const result = await SitterService.getSitterBoarding(clientId, searchText);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Boarding services retrieved successfully",
      data: result,
    });
  }
);


const getSitterServicesForWalkingController = catchAsync(
  async (req: Request, res: Response) => {

    const clientId = req.user.id
    const searchText = req.query.search as string | undefined;

    const result = await SitterService.getSitterServicesForWalking(clientId, searchText);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Walking services retrieved successfully",
      data: result,
    });
  }
)

const getSitterServicesForDogCareController = catchAsync(
  async (req: Request, res: Response) => {

    const clientId = req.user.id

    const searchText = req.query.search as string | undefined;
    const result = await SitterService.getSitterServicesForDogCare(clientId, searchText);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Dog Care services retrieved successfully",
      data: result,
    });
  }
)




export const SitterController = {
  getSitterRecommendations,
  getSitterDetails,
  rateSitter,
  getAllSitterForServices,
  getSitterServicesForBoarding,
  getSitterServicesForWalkingController,
  getSitterServicesForDogCareController

}; 