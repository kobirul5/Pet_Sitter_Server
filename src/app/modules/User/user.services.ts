import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { User, Prisma, ServiceType } from "@prisma/client";
import config from "../../../config";
import httpStatus from "http-status";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { omit, update } from "lodash";
import { IUser, IUserFilters } from "./user.interface";
import { fileUploader } from "../../../helpars/fileUploader";

// get user profile
const getMyProfile = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const userProfile = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!userProfile) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const userWithoutSensitive = omit(userProfile, ["password", "fcmToken"]);

  return userWithoutSensitive;
};

// Update user profile
const updateUserProfile = async (userId: string, updateData: Partial<IUser>, file?: Express.Multer.File) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }



  // If file exists, upload and set profileImage url
  if (file) {
    const uploadedImageUrl = await fileUploader.uploadToDigitalOcean(file);
    updateData.profileImage = uploadedImageUrl.Location;
  }


  // Update user profile with only provided fields
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      phone: true,
      role: true,
      status: true,
      location: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
      services: true
    },
  });


  return updatedUser;
};


//update user profile image
const updateUserProfileImage = async (userToken: string, imageUrl: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id }, // ✅ fixed here
    data: {
      profileImage: imageUrl,
    },
    select: {
      id: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};

//get all users
const getAllUser = async (filters: IUserFilters) => {
  const { searchTerm, status, role } = filters;

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder || "desc";

  // const whereConditions: Prisma.UserWhereInput = {
  //   NOT: {
  //     role: "Admin",
  //   },
  // };

  const whereConditions: Prisma.UserWhereInput = {
    NOT: {
      role: "Admin",
    },
  };


  if (searchTerm) {
    whereConditions.OR = [
      {
        firstName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }

  if (status) {
    whereConditions.status = status;
  }

  if (role) {
    whereConditions.role = role;
  }

  const total = await prisma.user.count({
    where: whereConditions,
  });

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      profileImage: true,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

// toggle user online status
const toggleNotificationOnOff = async (
  userToken: string,
  isNotificationOn: boolean
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      isNotificationOn,
    },
    select: {
      id: true,
      isNotificationOn: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};

const toggleAvailableOnOff = async (
  userToken: string,
  isAvailable: boolean
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      isAvailable,
    },
    select: {
      id: true,
      isAvailable: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};

// Update sitter profile with per-day fee and other sitter-specific info
const updateSitterProfile = async (
  userToken: string,
  updateData: {
    perDayFee?: number;
    experience?: string;
    about?: string;
    location?: string;
    lat?: number;
    lng?: number;
  }
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if user is a sitter
  if (existingUser.role !== "Sitter") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only sitters can update sitter profile");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: updateData,
    select: {
      id: true,
      experience: true,
      about: true,
      location: true,
      lat: true,
      lng: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// Create or update sitter profile details
const updateSitterProfileDetails = async (
  userToken: string,
  profileData: {
    bio?: string;
    experience?: string;
    education?: string;
    certifications?: string[];
    languages?: string[];
    availability?: string;
  }
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (existingUser.role !== "Sitter") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only sitters can update sitter profile");
  }

  // Upsert sitter profile
  const sitterProfile = await prisma.sitterProfile.upsert({
    where: { userId: decodedToken.id },
    update: profileData,
    create: {
      userId: decodedToken.id,
      ...profileData,
    },
  });

  return sitterProfile;
};

// Add service for sitter
const addSitterService = async (
  userToken: string,
  serviceData: {
    name: string;
    description?: string;
    price: number;
    serviceType: "DAYCARE" | "BOARDING" | "WALKING"; // corrected spelling
  }
) => {
  const decodedToken = jwtHelpers.verifyToken(userToken, config.jwt.jwt_secret!);

  const existingUser = await prisma.user.findUnique({ where: { id: decodedToken.id } });
  if (!existingUser) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  const allowedTypes = ["DAYCARE", "BOARDING", "WALKING"];
  if (!allowedTypes.includes(serviceData.serviceType)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid service type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  const service = await prisma.service.create({
    data: {
      name: serviceData.name,
      description: serviceData.description,
      price: serviceData.price,
      serviceType: serviceData.serviceType, // ensure DB column matches spelling
      userId: decodedToken.id,
    },
  });

  return service;
};


// Get sitter services
const getSitterServices = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const services = await prisma.service.findMany({
    where: { userId: decodedToken.id },
    orderBy: { createdAt: "desc" },
  });

  return services;
};

// Update sitter service
const updateSitterService = async (
  userToken: string,
  serviceId: string,
  serviceData: {
    name?: string;
    description?: string;
    price?: number;
  }
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );
  // Check if service exists and belongs to user
  const existingService = await prisma.service.findFirst({
    where: {
      id: serviceId,
      userId: decodedToken.id,
    },
  });

  if (!existingService) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }


  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: serviceData,
  });

  return updatedService;
};

// Delete sitter service
const deleteSitterService = async (userToken: string, serviceId: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  // Check if service exists and belongs to user
  const existingService = await prisma.service.findFirst({
    where: {
      id: serviceId,
      userId: decodedToken.id,
    },
  });

  if (!existingService) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  if(service.userId !== user.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You can only delete your own services");
  }


  await prisma.service.delete({
    where: { id: serviceId },
  });

  return { message: "Service deleted successfully" };
};


const changeSitterStatus = async ({ userId, serviceStatus }: { userId: string; serviceStatus: ServiceType }) => {

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (existingUser.role !== "Sitter") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only sitters can change status");
  }

  const serviceStatusType = Object.values(ServiceType);
  if (!serviceStatusType.includes(serviceStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid service status ${ServiceType.BOARDING} or ${ServiceType.WALKING} or ${ServiceType.DAYCARE} required `);
  }

  const services = await prisma.service.findFirst({
    where: { serviceType: serviceStatus },
  });

  if(!services){
    throw new ApiError(httpStatus.BAD_REQUEST, "Service not found");
  }

  // const result = await prisma.user.update({
  //   where: { id: userId },
  //   data: {
  //     serviceId: services.id,
  //     serviceType: serviceStatus
  //   },
  //   include: {
  //     services: true
  //   }
  // });

  const result = await prisma.service.create({
    data: {
      name: services.name,
      description: services.description,
      price: services.price,
      serviceType: serviceStatus, // ensure DB column matches spelling
      userId: userId,
    },
  });


  return result;
}

export const UserService = {
  getMyProfile,
  updateUserProfile,
  updateUserProfileImage,
  getAllUser,
  toggleNotificationOnOff,
  toggleAvailableOnOff,
  updateSitterProfile,
  updateSitterProfileDetails,
  addSitterService,
  getSitterServices,
  updateSitterService,
  deleteSitterService,
  changeSitterStatus
};
