import { UserRole, UserStatus } from "@prisma/client";

export interface ISitterProfile {
  id?: string;
  userId?: string;
  bio?: string | null;
  experience?: string | null;
  education?: string | null;
  certifications?: string[];
  languages?: string[];
  availability?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IService {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRating {
  id?: string;
  rating: number;
  review?: string | null;
  userId: string;
  sitterId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISitterFilters {
  searchTerm?: string;
  location?: string;
  service?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistance?: number;
  userLat?: number;
  userLng?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ISitterRecommendation {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  perDayFee?: number | null;
  totalRating?: number | null;
  totalReviews?: number | null;
  experience?: string | null;
  about?: string | null;
  services: IService[];
  distance?: number | null;
  sitterProfile?: ISitterProfile | null;
}

export interface ISitterDetail {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  perDayFee?: number | null;
  totalRating?: number | null;
  totalReviews?: number | null;
  experience?: string | null;
  about?: string | null;
  services: IService[];
  sitterProfile?: ISitterProfile | null;
  ratings: IRating[];
  averageRating: number;
}

export interface ICreateRating {
  rating: number;
  review?: string;
  sitterId: string;
} 