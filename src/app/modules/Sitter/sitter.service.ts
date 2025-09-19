import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { NotificationType, Prisma, ServiceType, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { omit } from "lodash";
import {
  ISitterFilters,
  ISitterRecommendation,
  ISitterDetail,
  ICreateRating,
} from "./sitter.interface";
import config from "../../../config";
import { notificationService } from "../notification/notification.service";

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Get sitter recommendations based on location and filters
// const getSitterRecommendations = async (
//   userID: string,
//   filters: ISitterFilters
// ): Promise<{ meta: any; data: any }> => {

//   // Get user's location
//   const user = await prisma.user.findUnique({
//     where: { id: userID },
//     select: { lat: true, lng: true, location: true }
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const page = Number(filters.page || 1);
//   const limit = Number(filters.limit || 10);
//   const skip = (page - 1) * limit;
//   const sortBy = filters.sortBy || "totalRating";
//   const sortOrder = filters.sortOrder || "desc";

//   // Build where conditions for sitters
//   const whereConditions: Prisma.UserWhereInput = {
//     role: "Sitter",
//     status: "ACTIVE",
//     isAvailable: true,
//   };

//   // Add search term filter
//   if (filters.searchTerm) {
//     whereConditions.OR = [
//       {
//         firstName: {
//           contains: filters.searchTerm,
//           mode: "insensitive",
//         },
//       },
//       {
//         lastName: {
//           contains: filters.searchTerm,
//           mode: "insensitive",
//         },
//       },
//       {
//         location: {
//           contains: filters.searchTerm,
//           mode: "insensitive",
//         },
//       },
//       {
//         about: {
//           contains: filters.searchTerm,
//           mode: "insensitive",
//         },
//       },
//     ];
//   }

//   // Add location filter
//   if (filters.location) {
//     whereConditions.location = {
//       contains: filters.location,
//       mode: "insensitive",
//     };
//   }

//   // // Add price range filter
//   // if (filters.minPrice || filters.maxPrice) {
//   //   whereConditions. = {};
//   //   if (filters.minPrice) {
//   //     whereConditions.perDayFee.gte = filters.minPrice;
//   //   }
//   //   if (filters.maxPrice) {
//   //     whereConditions.perDayFee.lte = filters.maxPrice;
//   //   }
//   // }

//   // Add rating filter
//   if (filters.minRating) {
//     whereConditions.totalRating = {
//       gte: filters.minRating,
//     };
//   }

//   // Get total count
//   const total = await prisma.user.count({
//     where: whereConditions,
//   });

//   // Get sitters with their services and profile
//   const sitters = await prisma.user.findMany({
//     where:  {
//     ...whereConditions,
//     services: {
//       some: {},  
//     },
//   },
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//    include:{
//     services: true
//    }
//   });

//   // Calculate distances and filter by max distance if provided
//   let filteredSitters = sitters;
//   if (user.lat && user.lng && filters.maxDistance) {
//     filteredSitters = sitters.filter(sitter => {
//       if (sitter.lat && sitter.lng) {
//         const distance = calculateDistance(
//           user.lat!,
//           user.lng!,
//           sitter.lat,
//           sitter.lng
//         );
//         return distance <= filters.maxDistance!;
//       }
//       return true;
//     });
//   }

//   // Add distance to each sitter
//   const sittersWithDistance = filteredSitters.map(sitter => {
//     let distance = null;
//     if (user.lat && user.lng && sitter.lat && sitter.lng) {
//       distance = calculateDistance(
//         user.lat,
//         user.lng,
//         sitter.lat,
//         sitter.lng
//       );
//     }

//     return {
//       ...sitter,
//       distance: distance ? Math.round(distance * 100) / 100 : null, // Round to 2 decimal places
//     };
//   });

//   // Sort by distance if user location is available
//   if (user.lat && user.lng) {
//     sittersWithDistance.sort((a, b) => {
//       if (a.distance === null && b.distance === null) return 0;
//       if (a.distance === null) return 1;
//       if (b.distance === null) return -1;
//       return a.distance - b.distance;
//     });
//   }

//    let services = sitters.flatMap((sitter) =>
//     sitter.services.map((service) => {
//       let distance: number | null = null;
//       if (user.lat && user.lng && sitter.lat && sitter.lng) {
//         distance = calculateDistance(user.lat, user.lng, sitter.lat, sitter.lng);
//       }}));


//   return {
//     meta: {
//       page,
//       limit,
//       total: filteredSitters.length,
//       totalPage: Math.ceil(filteredSitters.length / limit),
//     },
//     data: services,
//   };
// };

const getSitterRecommendations = async (
  clientId: string,
  filters: ISitterFilters
) => {
  // Get denied services for the client
  const deniedServices = await prisma.user.findUnique({
    where: { id: clientId },
    select: { deniedServices: true },
  });

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  // Get services excluding denied ones, sorted by perDayFee ascending
  const services = await prisma.service.findMany({
    where: {
      id: { notIn: deniedServices?.deniedServices || [] },
    },
    skip,
    take: limit,
    orderBy: {
      price: "asc", 
    },
  });

  // Get total count for pagination
  const total = await prisma.service.count({
    where: {
      id: { notIn: deniedServices?.deniedServices || [] },
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: services,
  };
};



const getAllServices = async (clientId: string, searchText?: string) => {
  // 1. Fetch the client to get denied services
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { deniedServices: true },
  });

  const deniedServiceIds = client?.deniedServices || [];

  // 2. Fetch all services excluding denied ones and apply search filter
  const services = await prisma.service.findMany({
    where: {
      id: { notIn: deniedServiceIds },
      ...(searchText && {
        OR: [
          { name: { contains: searchText, mode: "insensitive" } },
          { description: { contains: searchText, mode: "insensitive" } },
          {
            user: {
              OR: [
                { firstName: { contains: searchText, mode: "insensitive" } },
                { lastName: { contains: searchText, mode: "insensitive" } },
                { about: { contains: searchText, mode: "insensitive" } },
                { email: { contains: searchText, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          serviceAvailableDates: true,
          sitterProfile: true,
          about: true,
          email: true,
          totalRating: true,
          ratingsReceived: true,
        },
      },
    },
  });

  return services;
};


const getSitterBoarding = async (clientId: string, searchText?: string) => {
  // 1. Get denied services for this client
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { deniedServices: true },
  });

  const deniedServiceIds = client?.deniedServices || [];

  // 2. Fetch BOARDING services excluding denied ones, with optional search
  const services = await prisma.service.findMany({
    where: {
      serviceType: ServiceType.BOARDING,
      id: { notIn: deniedServiceIds },
      ...(searchText && {
        OR: [
          { name: { contains: searchText, mode: "insensitive" } },
          { description: { contains: searchText, mode: "insensitive" } },
          {
            user: {
              OR: [
                { firstName: { contains: searchText, mode: "insensitive" } },
                { lastName: { contains: searchText, mode: "insensitive" } },
                { about: { contains: searchText, mode: "insensitive" } },
                { email: { contains: searchText, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          serviceAvailableDates: true,
          sitterProfile: true,
          about: true,
          email: true,
          totalRating: true,
          ratingsReceived: true,
        },
      },
    },
  });

  return services;
};

const getSitterServicesForWalking = async (clientId: string) => {


  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { deniedServices: true },
  });

  const deniedServiceIds = client?.deniedServices || [];

   const services = await prisma.service.findMany({
    where: {
      serviceType: ServiceType.WALKING,
      id: { notIn: deniedServiceIds },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          serviceAvailableDates: true,
          sitterProfile: true,
          // services: true,
          about: true,
          email: true,
          totalRating: true,
          ratingsReceived: true,
        },
      },
    }
  });
  return services;
}

//  GET ALL SITTERS  SERvice for DAYCARE

const getSitterServicesForDogCare = async (clientId: string) => {

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { deniedServices: true },
  });

  const deniedServiceIds = client?.deniedServices || [];




   const services = await prisma.service.findMany({
    where: {
      serviceType: ServiceType.DAYCARE,
      id: { notIn: deniedServiceIds },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          serviceAvailableDates: true,
          sitterProfile: true,
          // services: true,
          about: true,
          email: true,
          totalRating: true,
          ratingsReceived: true,
        },
      },
    }
  });
  return services;
}



// Get sitter details by ID
const getSitterDetails = async (
  userToken: string,
  sitterId: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const sitter = await prisma.user.findUnique({
    where: {
      id: sitterId,
      role: "Sitter",
      status: "ACTIVE",
    },
    include: {
      services: true,
      sitterProfile: true,
      ratingsReceived: {
        include: {
          ratingsGiven: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!sitter) {
    throw new ApiError(httpStatus.NOT_FOUND, "Sitter not found");
  }

  // Calculate average rating
  const totalRating = sitter.ratingsReceived.reduce((sum, rating) => sum + rating.rating, 0);
  const averageRating = sitter.ratingsReceived.length > 0
    ? totalRating / sitter.ratingsReceived.length
    : 0;


  return {
    id: sitter.id,
    firstName: sitter.firstName,
    lastName: sitter.lastName,
    profileImage: sitter.profileImage,
    location: sitter.location,
    lat: sitter.lat,
    lng: sitter.lng,
    serviceAvailableDates: sitter.serviceAvailableDates,
    email: sitter.email,
    // perDayFee: sitter.perDayFee,
    totalRating: sitter.totalRating,
    totalReviews: sitter.totalReviews,
    experience: sitter.experience,
    about: sitter.about,
    services: sitter.services,
    // serviceType: sitter.serviceType,
    ratings: sitter.ratingsReceived,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
  };
};

// Rate a sitter
const rateSitter = async (
  ratingsGivenId: string, // user giving the rating
  ratingData: ICreateRating
): Promise<any> => {

  // Check if sitter exists
  const sitter = await prisma.user.findFirst({
    where: {
      id: ratingData.ratingsReceivedId,
      role: "Sitter",
    },
  });

  if (!sitter) {
    throw new ApiError(httpStatus.NOT_FOUND, "Sitter not found");
  }

  // Prevent self-rating
  if (ratingsGivenId === ratingData.ratingsReceivedId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot rate yourself");
  }

  // Check if already rated
  const existingRating = await prisma.rating.findUnique({
    where: {
      ratingsGivenId_ratingsReceivedId: {
        ratingsGivenId,
        ratingsReceivedId: ratingData.ratingsReceivedId,
      },
    },
  });

  if (existingRating) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have already rated this sitter");
  }

  // Validate rating value
  if (ratingData.rating < 1 || ratingData.rating > 5) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
  }

  // Create rating
  const rating = await prisma.rating.create({
    data: {
      rating: ratingData.rating,
      review: ratingData.review,
      ratingsGivenId,
      ratingsReceivedId: ratingData.ratingsReceivedId,
    },
    include: {
      ratingsGiven: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          fcmToken: true,
        },
      },
      ratingsReceived: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          fcmToken: true,
        },
      },
    },
  });

  // Recalculate sitter's average rating
  const sitterRatings = await prisma.rating.findMany({
    where: { ratingsReceivedId: ratingData.ratingsReceivedId },
  });

  const totalRating = sitterRatings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / sitterRatings.length;

  await prisma.user.update({
    where: { id: ratingData.ratingsReceivedId },
    data: {
      totalRating: Math.round(averageRating * 10) / 10,
      totalReviews: sitterRatings.length,
    },
  });



  const sitterReviewPayload = {
    title: `You have received a new review`,
    body: `${rating.ratingsGiven.firstName} ${rating.ratingsGiven.lastName} rated you ${rating.rating} stars with a comment: "${rating.review}"`,
    type: NotificationType.GENERAL,
    data: JSON.stringify({
      requestId: rating.id,
      sitterId: rating.ratingsReceivedId,
      rating: rating.ratingsGivenId,
    }),
    receiverId: rating.ratingsReceivedId,
  };


  if (rating.ratingsReceived?.fcmToken) {
    await notificationService.sendNotification(
      rating.ratingsReceived?.fcmToken,
      sitterReviewPayload,
      rating.ratingsGivenId
    );
  }

  //save notification to the courier
  await notificationService.saveNotification(
    sitterReviewPayload,
    rating.ratingsGivenId
  );



  return rating;
};








export const SitterService = {
  getAllServices,
  getSitterRecommendations,
  getSitterDetails,
  rateSitter,
  getSitterBoarding,
  getSitterServicesForWalking,
  getSitterServicesForDogCare


}; 