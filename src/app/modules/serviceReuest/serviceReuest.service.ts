import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { ICreateRequestData } from "../Sitter/sitter.interface";
import { PaymenttStatus, RequestStatus } from "@prisma/client";
import { IClinetRating, IDogRating } from "./serviceRequest.interface";
import { result } from "lodash";

const createClientRequestService = async (data: ICreateRequestData) => {
  // Validate sitter exists and is active
  const sitter = await prisma.user.findFirst({
    where: {
      id: data.sitterId,
      role: 'Sitter',
      status: 'ACTIVE',
    },
  });

  if (!sitter) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sitter not found or inactive');
  }

  const dog = await prisma.dog.findFirst({
    where: {
      id: data.dogId,
    },
  });

  if (!dog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Wrong Dog Id, Dog not found');
  }

  // Create the client request
  const request = await prisma.clientRequest.create({
    data: {
      clientId: data.clientId,
      sitterId: data.sitterId,
      dogId: data.dogId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      serviceType: data.serviceType,
      hourlyRate: data.hourlyRate,
      totalPrice: data.totalPrice,
      dogs: data.dogs,
    },
  });

  return request;
};

const getServiceRequests = async () => {
  const requests = await prisma.clientRequest.findMany({
    where: {
      status: {
        notIn: ["PENDING", "DENIED"]
      }
    }
  });
  return requests;
};

// get service for sitter
// const getServiceForSitterRequests = async (sitterId: string) => {
//   const requests = await prisma.clientRequest.findMany({
//     where: {
//       sitterId: sitterId,
//       status:{
//         notIn: ["PENDING","DENIED"]
//       }
//     },
//     include:{
//       sitter: true,
//       client: true,
//       dog: true
//     }
//   });
//   return requests;
// };

// get service requests by siiterId for sitter

const getServiceForSitterRequests = async (sitterId: string) => {
  const nowTime = new Date()

  // Fetch all requests for sitter with related data
  const allRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymenttStatus.COMPLETED,
      status: {
        notIn: ["PENDING", "DENIED", "COMPLETED", "ONGOING"],
      },
    },
    include: {
      // sitter: true,
      client: true,
      dog: true,
      // dog: true, // uncomment if needed
    },
  });

  const ongoingRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymenttStatus.COMPLETED,
      status: "ONGOING",
    },
    include: {

      client: true,
      dog: true,

    },
  });
  const upComeingRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymenttStatus.COMPLETED,
      status:  {
        notIn: ["PENDING", "DENIED", "COMPLETED", "ONGOING"],
      },
      endTime: {
        gt: nowTime,
      },
    },
    include: {
      client: true,
      dog: true,
    },
  });



  return {allRequests,ongoingRequests, upComeingRequests};
};

// update service status
const updateServicestatus = async (requestId: string, status: string, sitterId: string) => {

  if (status !== RequestStatus.ACCEPTED && status !== RequestStatus.DENIED && status !== RequestStatus.COMPLETED && status !== RequestStatus.ONGOING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status!. Status must be ACCEPTED , COMPLETED, ONGOING or DENIED');
  }

  if (!sitterId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }


  const serviceRequest = await prisma.clientRequest.findUnique({
    where: {
      id: requestId,
      sitterId: sitterId
    },
  });

  if (!serviceRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service request not found');
  }

  if(status === RequestStatus.ONGOING && serviceRequest.paymentStatus !== PaymenttStatus.COMPLETED){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status!. Service request is not completed Not payment yet');
  }


  if(status === RequestStatus.COMPLETED && serviceRequest.paymentStatus !== PaymenttStatus.COMPLETED){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status!. Service request is not completed Not payment yet ');
  }

  const result = await prisma.clientRequest.update({
    where: {
      id: requestId,
      sitterId: sitterId
    },
    data: {
      status: status,
    },
  });
  return result;
};

// getAllUpcomingAndOngoingCleintServices

const getAllUpcomingAndOngoingCleintServices = async (clientId: string) => {

  const nowTime = new Date()

  // // Fetch all requests for sitter with related data
  // const allRequests = await prisma.clientRequest.findMany({
  //   where: {
  //     clientId,
  //     paymentStatus: PaymenttStatus.COMPLETED,
  //     status: {
  //       notIn: ["PENDING", "DENIED", "COMPLETED", "ONGOING"],
  //     },
  //   },
  //   include: {
  //     // sitter: true,
  //     client: true,
  //     dog: true,
  //     // dog: true, // uncomment if needed
  //   },
  // });

  const ongoingRequests = await prisma.clientRequest.findMany({
    where: {
      clientId,
      paymentStatus: PaymenttStatus.COMPLETED,
      status: "ONGOING",
    },
    include: {

      client: true,
      dog: true,

    },
  });
  const upComeingRequests = await prisma.clientRequest.findMany({
    where: {
      clientId,
      paymentStatus: PaymenttStatus.COMPLETED,
      status:  {
        notIn: ["PENDING", "DENIED", "COMPLETED", "ONGOING"],
      },
      endTime: {
        gt: nowTime,
      },
    },
    include: {
      client: true,
      dog: true,
    },
  });

  const completedRequests = await prisma.clientRequest.findMany({
    where: {
      clientId,
      paymentStatus: PaymenttStatus.COMPLETED,
      status: "COMPLETED",
    },
    include: {
      client: true,
      dog: true,
    },
  });



  return {ongoingRequests, upComeingRequests, completedRequests};
}

// get clinet and dog details by request id

const getClinetAndDogProfileById = async (requestId: string) => {

  if(!requestId){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot get! unauthorized request');
  }


  const result = await prisma.clientRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
          createdAt: true,
          phone: true,
          address: true,
        }
      },
      dog: {
        select: {
          name: true,
          breed: true,
          images: true,
          gender: true,
          age: true,
          vaccination: true,
          spayed: true,
          about: true,
          createdAt: true
        }
      },
    },
  });
  return result;
};

const acceptClinerRequest = async (requestId: string, sitterId: string) => {


  if (!sitterId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }

  const sitter = await prisma.user.findUnique({
    where: {
      id: sitterId,
      role: "Sitter",
      status: "ACTIVE",
    },
  });

  if (!sitter) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! sitter not found');
  }


  const result = await prisma.clientRequest.update({
    where: {
      id: requestId,
      sitterId: sitterId
    },
    data: {
      status: RequestStatus.ACCEPTED,
    },
  });
  return result;
};

const createReviewCinetAndDog = async ({ requestId, client, dog}: {requestId: string, client:IClinetRating, dog:IDogRating}) => {
 
  if (!requestId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }
  if(!client){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! client not found');
  }
  if(!dog){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! dog not found');
  }

  const serviceReuestData = await prisma.clientRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
          createdAt: true,
          phone: true,
          address: true,
        }
      },
      dog: {
        select: {
          name: true,
          breed: true,
          images: true,
          gender: true,
          age: true,
          vaccination: true,
          spayed: true,
          about: true,
          createdAt: true
        }
      }
    },
  })

  if (!serviceReuestData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! sitter not found');
  }


  const clientReviwe = await prisma.rating.create({
    data: {
      review: client.review,
      rating: client.rating,
      ratingsGivenId: serviceReuestData.clientId,
      ratingsReceivedId: serviceReuestData.sitterId,
    },
  })


  const dogReview = await prisma.petRating.create({
    data: {
      review: dog.review,
      rating: dog.rating,
      ratingsGivenId: serviceReuestData.clientId,
      ratingsReceivedId: serviceReuestData.dogId,
    },
  })
  return {
    clientReviwe,
    dogReview
  }


};


const getAllAcceptedRequests = async (sitterId: string) => {

  if(!sitterId){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }


  const result = await prisma.clientRequest.findMany({
    where: {
      sitterId: sitterId,
      status: RequestStatus.PENDING,
      paymentStatus: PaymenttStatus.PENDING
    },
    include: {
      client: true,
    },
  });
  return result;
}


const getAcceptServiceForPayment = async (clientId: string) => {

  if(!clientId){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot get! unauthorized request');
  }
  const result = await prisma.clientRequest.findMany({
    where: {
      clientId: clientId,
      status: RequestStatus.ACCEPTED,
      paymentStatus: PaymenttStatus.PENDING
    },
    include: {
      sitter: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
          createdAt: true,
          phone: true,
          address: true,
        }
      }
    },
  })
  return result;
}

export const serviceReuestService = {
  createClientRequestService,
  getServiceRequests,
  getServiceForSitterRequests,
  updateServicestatus,
  getClinetAndDogProfileById,
  acceptClinerRequest,
  createReviewCinetAndDog,
  getAllAcceptedRequests,
  getAllUpcomingAndOngoingCleintServices,
  getAcceptServiceForPayment

};