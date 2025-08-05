import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import ApiError from "../../../errors/ApiErrors";
import { UserService } from "./user.services";
import { fileUploader } from "../../../helpars/fileUploader";

// get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await UserService.getMyProfile(userToken as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});

// update user profile
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { ...userData } = req.body;
  let imageUrl: string | undefined;

  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Handle profile image
    if (files.profileImage?.[0]) {
      const uploaded = await fileUploader.uploadToDigitalOcean(files.profileImage[0]);
      imageUrl = uploaded.Location;
    }
  }

  const result = await UserService.updateUser(
    token as string,
    userData,
    imageUrl || "",
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

//update profile picture
const updateProfileImage = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const file = req.file; //

  if (!file) {
    throw new ApiError(400, "No image found");
  }

  // DigitalOcean image upload
  const uploaded = await fileUploader.uploadToDigitalOcean(file);
  const imageUrl = uploaded.Location;

  // service call to update user profile image
  const user = await UserService.updateUserProfileImage(
    userToken as string,
    imageUrl
  );

  // service call to update user profile image
  res.status(200).json({
    success: true,
    message: "User profile image updated successfully!",
    data: user,
  });
});

const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const result = await UserService.getAllUser(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All User retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const toggleNotificationOnOff = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { isNotificationOn } = req.body;

  const result = await UserService.toggleNotificationOnOff(
    token as string,
    isNotificationOn
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User notification is now ${isNotificationOn ? 'on' : 'off'}`,
    data: result,
  });
});

const toggleAvailableOnOff = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { isAvailable } = req.body;

  const result = await UserService.toggleAvailableOnOff(
    token as string,
    isAvailable
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is now ${isAvailable ? 'online' : 'offline'}`,
    data: result,
  });
});

// Update sitter profile
const updateSitterProfile = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const updateData = req.body;

  const result = await UserService.updateSitterProfile(
    token as string,
    updateData
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sitter profile updated successfully",
    data: result,
  });
});

// Update sitter profile details
const updateSitterProfileDetails = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const profileData = req.body;

  const result = await UserService.updateSitterProfileDetails(
    token as string,
    profileData
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sitter profile details updated successfully",
    data: result,
  });
});

// Add sitter service
const addSitterService = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const serviceData = req.body;

  const result = await UserService.addSitterService(
    token as string,
    serviceData
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Service added successfully",
    data: result,
  });
});

// Get sitter services
const getSitterServices = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;

  const result = await UserService.getSitterServices(token as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sitter services retrieved successfully",
    data: result,
  });
});

// Update sitter service
const updateSitterService = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { serviceId } = req.params;
  const serviceData = req.body;

  const result = await UserService.updateSitterService(
    token as string,
    serviceId,
    serviceData
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service updated successfully",
    data: result,
  });
});

// Delete sitter service
const deleteSitterService = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { serviceId } = req.params;

  const result = await UserService.deleteSitterService(
    token as string,
    serviceId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service deleted successfully",
    data: result,
  });
});

export const UserController = {
  getMyProfile,
  updateUser,
  updateProfileImage,
  getAllUser,
  toggleNotificationOnOff,
  toggleAvailableOnOff,
  updateSitterProfile,
  updateSitterProfileDetails,
  addSitterService,
  getSitterServices,
  updateSitterService,
  deleteSitterService,
};
