import { z } from "zod";

// Validation schema for sitter filters
const sitterFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  location: z.string().optional(),
  service: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxDistance: z.number().min(0).optional(),
  userLat: z.number().min(-90).max(90).optional(),
  userLng: z.number().min(-180).max(180).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Validation schema for creating a rating
const createRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(500).optional(),
  sitterId: z.string().min(1),
});

// Validation schema for updating a rating
const updateRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(500).optional(),
});

// Validation schema for sitter profile
const sitterProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  experience: z.string().max(500).optional(),
  education: z.string().max(500).optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  availability: z.string().max(500).optional(),
});

// Validation schema for service
const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
});

// Validation schema for updating user as sitter
const updateSitterSchema = z.object({
  perDayFee: z.number().min(0).optional(),
  experience: z.string().max(500).optional(),
  about: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const SitterValidation = {
  sitterFiltersSchema,
  createRatingSchema,
  updateRatingSchema,
  sitterProfileSchema,
  serviceSchema,
  updateSitterSchema,
}; 