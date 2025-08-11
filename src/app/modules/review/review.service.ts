
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';


interface IPetReview {
  clientId: string;
  dogId: string;
  review: string;
  rating: number;
}


interface IPetReview {
  // sitterId: string;
  dogId: string;
  review: string;
  rating: number;
}

interface IClientReview {
  // sitterId: string;  // fixed typo here
  clientId: string;
  review: string;
  rating: number;
}

interface IReview {
  petData: IPetReview;
  clientData: IClientReview;
  sitterId: string
}

const createIntoDb = async ({ clientData, petData, sitterId }: IReview) => {
  if (!clientData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Client data is required');
  }

  if (!petData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Pet data is required');
  }

  try {
    const [petRating, clientRating] = await Promise.all([
      prisma.petRating.create({ data: {
        ratingsGivenId: sitterId,
        ratingsReceivedId: petData.dogId,
        review: petData.review,
        rating: petData.rating
      } }),
      prisma.rating.create({ data:{
        ratingsGivenId: sitterId,
        ratingsReceivedId: clientData.clientId,
        review: clientData.review,
        rating: clientData.rating
      }}),
    ]);

    return { petRating, clientRating };
  } catch (error) {
    // You can handle Prisma or DB errors here as needed
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create reviews');
  }
};



export const reviewService = {
createIntoDb,
};