
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { IReview } from './review.interface';
import { NotificationType } from '@prisma/client';
import { notificationService } from '../notification/notification.service';




const createIntoDb = async ({ clientData, petData, sitterId }: IReview) => {
  if (!clientData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Client data is required');
  }

  if (!petData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Pet data is required');
  }

  try {
    const [petRating, clientRating] = await Promise.all([
      prisma.petRating.create({
        data: {
        ratingsGivenId: sitterId,
        ratingsReceivedId: petData.dogId,
        review: petData.review,
        rating: petData.rating
      },
    }),
      prisma.rating.create({
         data:{
        ratingsGivenId: sitterId,
        ratingsReceivedId: clientData.clientId,
        review: clientData.review,
        rating: clientData.rating
      },
      include: {
        ratingsGiven: true,
        ratingsReceived: true
      }
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create reviews');
  }
};



export const reviewService = {
createIntoDb,
};