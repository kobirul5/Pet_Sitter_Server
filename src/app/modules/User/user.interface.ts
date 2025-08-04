import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string;
  email: string;
  fullName: string;
  profileImage: string;
  password: string;
  role: UserRole;
  profession: string;
  promoCode: string;
  status: UserStatus;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserFilterRequest = {
  name?: string | undefined;
  email?: string | undefined;
  contactNumber?: string | undefined;
  searchTerm?: string | undefined;
  minAge?: number | undefined;
  maxAge?: number | undefined;
  distanceRange?: number | undefined;
};

export type IUserFilters = {
  searchTerm?: string;
  status?: UserStatus;
  role?: UserRole;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IUpdateUserStatus = {
  status: UserStatus;
};

export type IUserResponse = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
