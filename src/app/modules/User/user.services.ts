import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { User, Prisma } from "@prisma/client";
import config from "../../../config";
import httpStatus from "http-status";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { omit } from "lodash";
import { IUserFilters } from "./user.interface";

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
const updateUser = async (
  userToken: string,
  updateData: User,
  imageUrl: string,
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

  // Create a filtered update object that excludes empty string and null values, and ensures correct types
  const filteredUpdateData: Partial<Prisma.UserUpdateInput> = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (value !== "" && value !== null && value !== undefined) {
      filteredUpdateData[key as keyof Prisma.UserUpdateInput] = value;
    }
  }
  // Check if phone exists for another user (only if phone is being changed and not empty)
  if (
    filteredUpdateData.email &&
    filteredUpdateData.email !== existingUser.email
  ) {
    const phoneExists = await prisma.user.findFirst({
      where: {
        email:
          typeof filteredUpdateData.email === "string"
            ? filteredUpdateData.email
            : String(filteredUpdateData.email),
        id: { not: decodedToken.id },
      },
    });
    if (phoneExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Phone already exists");
    }
  }

  // Handle date of birth formatting - keep original format
  if ((filteredUpdateData as any).dob) {
    (filteredUpdateData as any).dob = (filteredUpdateData as any).dob;
  }

  const { ...otherUpdateData } = filteredUpdateData;

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      ...otherUpdateData,
      profileImage: imageUrl || existingUser.profileImage,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
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


export const UserService = {
  getMyProfile,
  updateUser,
  updateUserProfileImage,
  getAllUser,
  toggleNotificationOnOff,
  toggleAvailableOnOff
};
