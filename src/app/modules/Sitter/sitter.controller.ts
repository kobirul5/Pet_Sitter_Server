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
    const sitterId = req.user.id;
    const result = await SitterService.getSitterBoarding();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sitter services retrieved successfully",
      data: result,
    });
  }
);


// const getSitterBoarding = catchAsync(async (req: Request, res: Response) => {
//     console.log("req.user.id", req.user.id);
//     const sitterId = req.user.id;
//     console.log(sitterId);
//     const result = await SitterService.getSitterBoarding(sitterId);
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Sitter Boarding retrieved successfully",
//       data: result,
//     });
//   }
// );


// // Update sitter rating
// const updateSitterRating = catchAsync(
//   async (req: Request, res: Response) => {
//     const userToken = req.headers.authorization as string;
//     const { sitterId } = req.params;
//     const ratingData = req.body;

//     const result = await SitterService.updateSitterRating(
//       userToken,
//       sitterId,
//       ratingData
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Sitter rating updated successfully",
//       data: result,
//     });
//   }
// );

// // Delete sitter rating
// const deleteSitterRating = catchAsync(
//   async (req: Request, res: Response) => {
//     const userToken = req.headers.authorization as string;
//     const { sitterId } = req.params;

//     const result = await SitterService.deleteSitterRating(userToken, sitterId);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Sitter rating deleted successfully",
//       data: result,
//     });
//   }
// );

// // Get user's ratings
// const getUserRatings = catchAsync(
//   async (req: Request, res: Response) => {
//     const userToken = req.headers.authorization as string;

//     const result = await SitterService.getUserRatings(userToken);

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "User ratings retrieved successfully",
//       data: result,
//     });
//   }
// );






export const SitterController = {
  getSitterRecommendations,
  getSitterDetails,
  rateSitter,
  // getSitterBoarding,
  // updateSitterRating,
  // deleteSitterRating,
  // getUserRatings,
  getAllSitterForServices,
  getSitterServicesForBoarding

}; 