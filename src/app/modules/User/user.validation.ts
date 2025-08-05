import { z } from "zod";

const CreateUserValidationSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"), // Ensure email is provided and is valid

  name: z.string().optional(),
  password: z.string().nonempty("Password is required"),
});

export { CreateUserValidationSchema };
const UserLoginValidationSchema = z.object({
  email: z.string().email().nonempty("Email is required"),
  password: z.string().nonempty("Password is required"),
});

const userUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  promoCode: z.string().optional(),
  profession: z.string().optional(),
});

// Sitter profile validation schemas
const sitterProfileUpdateSchema = z.object({
  perDayFee: z.number().min(0).optional(),
  experience: z.string().max(500).optional(),
  about: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const sitterProfileDetailsSchema = z.object({
  bio: z.string().max(1000).optional(),
  experience: z.string().max(500).optional(),
  education: z.string().max(500).optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  availability: z.string().max(500).optional(),
});

const sitterServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
});

const sitterServiceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
});

export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema,
  userUpdateSchema,
  sitterProfileUpdateSchema,
  sitterProfileDetailsSchema,
  sitterServiceSchema,
  sitterServiceUpdateSchema,
};
