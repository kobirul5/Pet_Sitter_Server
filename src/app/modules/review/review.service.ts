import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IReview } from "./review.interface";
import { NotificationType } from "@prisma/client";
import { notificationService } from "../notification/notification.service";

const createIntoDb = async ({ clientData, petData, sitterId }: IReview) => {
  if (!clientData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Client data is required");
  }

  if (!petData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Pet data is required");
  }

  const [existingClientRating, existingPetRating] = await Promise.all([
    prisma.rating.findFirst({
      where: {
        ratingsGivenId: sitterId,
        ratingsReceivedId: clientData.clientId,
      },
    }),
    prisma.petRating.findFirst({
      where: {
        ratingsGivenId: sitterId,
        ratingsReceivedId: petData.dogId,
      },
    }),
  ]);

  if (existingClientRating) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You have already reviewed this client"
    );
  }

  if (existingPetRating) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You have already reviewed this dog"
    );
  }

  try {
    const [petRating, clientRating] = await Promise.all([
      prisma.petRating.create({
        data: {
          ratingsGivenId: sitterId,
          ratingsReceivedId: petData.dogId,
          review: petData.review,
          rating: petData.rating,
        },
      }),
      prisma.rating.create({
        data: {
          ratingsGivenId: sitterId,
          ratingsReceivedId: clientData.clientId,
          review: clientData.review,
          rating: clientData.rating,
        },
        include: {
          ratingsGiven: true,
          ratingsReceived: true,
        },
      }),
    ]);

    const sitterName = `${clientRating.ratingsGiven.firstName} ${clientRating.ratingsGiven.lastName}`;
    const clientName = `${clientRating.ratingsReceived.firstName} ${clientRating.ratingsReceived.lastName}`;

    const payload = {
      title: `New Review Submitted`,
      body: `${sitterName} has submitted a review for ${clientName}.`,
      type: NotificationType.GENERAL,
      data: JSON.stringify({
        ratingId: clientRating.id,
        sitterId: clientRating.ratingsGivenId,
      }),
      receiverId: clientRating.ratingsReceivedId,
    };

    if (clientRating.ratingsReceived?.fcmToken) {
      await notificationService.sendNotification(
        clientRating.ratingsReceived.fcmToken,
        payload,
        clientRating.ratingsReceivedId
      );
    }

    // save notification in DB
    await notificationService.saveNotification(
      payload,
      clientRating.ratingsReceivedId
    );

    return { petRating, clientRating };
  } catch (error) {
    // You can handle Prisma or DB errors here as needed
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create reviews"
    );
  }
};

const createReviewSitter = async ({ sitterData, userId }: { sitterData: any; userId: string }) => {


  const sitterExists = await prisma.user.findFirst({
    where: {
      id: sitterData.sitterId,
    },
  });
  if (!sitterExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Sitter not found");
  }

  if (userId === sitterData.sitterId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot review yourself");
  }

  const existingSitterRating = await prisma.rating.findFirst({
    where: {
      ratingsGivenId: userId,
      ratingsReceivedId: sitterData.sitterId,
    },
  });

  if (existingSitterRating) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You have already reviewed this sitter"
    );
  }

  try {
    const sitterRating = await prisma.rating.create({
      data: {
        ratingsGivenId: userId,  // user giving the rating as sitter
        ratingsReceivedId: sitterData.sitterId,  // sitter being rated
        review: sitterData.review,
        rating: sitterData.rating,
      },
      include: {
        ratingsGiven: {select: { firstName: true, lastName: true , email: true,  profileImage: true }},
        ratingsReceived: {select: { firstName: true, lastName: true , email: true,  profileImage: true }},
      },
    });

    const totalRatings = await prisma.rating.aggregate({
      where: { ratingsReceivedId: sitterData.sitterId },
      _avg: { rating: true },
    });

    console.log("Total Ratings Average:", totalRatings._avg.rating);
    const totalRatingValue = Number(totalRatings._avg.rating?.toFixed(1)) || 0;

    const userUpdate =  await prisma.user.update({
      where: { id: sitterData.sitterId },
      data: {
        totalRating: totalRatingValue,
      },
    });

    return sitterRating;
  } catch (error) {
    console.error("Error creating sitter rating:", error);
    // You can handle Prisma or DB errors here as needed
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create sitter rating"
    );
  }
};

const getUserOrSitterReviews = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

const reviews = await prisma.rating.findMany({
    where: {
      ratingsReceivedId: userId,
    },
    include: {
      ratingsGiven: { select: { firstName: true, lastName: true, profileImage: true, email: true } },
    },
})

const averageRatingData = await prisma.rating.aggregate({
    where: { ratingsReceivedId: userId },
    _avg: { rating: true },
  });

  const averageRating = Number(averageRatingData._avg.rating?.toFixed(1)) || 0;



  return {  averageRating ,reviews };



}

export const reviewService = {
  createIntoDb,
  createReviewSitter,
  getUserOrSitterReviews,
};
