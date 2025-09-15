import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { ICreateRequestData } from "../Sitter/sitter.interface";
import { NotificationType,  PaymentStatus,  RequestStatus } from "@prisma/client";
import { IClinetRating, IDogRating } from "./serviceRequest.interface";
import { result } from "lodash";
import { notificationService } from "../notification/notification.service";
import { Pay } from "twilio/lib/twiml/VoiceResponse";

// const createClientRequestService = async (data: ICreateRequestData) => {
//   // Validate sitter exists and is active
//   const sitter = await prisma.user.findFirst({
//     where: {
//       id: data.sitterId,
//       role: 'Sitter',
//       status: 'ACTIVE',
//     },
//   });

//   if (!sitter) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Sitter not found or inactive');
//   }

//   const dog = await prisma.dog.findFirst({
//     where: {
//       id: data.dogId,
//     },
//   });

//   if (!dog) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Wrong Dog Id, Dog not found');
//   }

//   // Create the client request
//   const request = await prisma.clientRequest.create({
//     data: {
//       clientId: data.clientId,
//       sitterId: data.sitterId,
//       dogId: data.dogId,
//       startTime: new Date(data.startTime),
//       endTime: new Date(data.endTime),
//       serviceType: data.serviceType,
//       hourlyRate: data.hourlyRate,
//       totalPrice: data.totalPrice,
//       dogs: data.dogs,
//     },
//     include: {
//       dog: true,
//       client: true,
//     }
//   });
  
//   await prisma.chat.create({
//     data: {
//       senderId: request.clientId,
//       receiverId: request.sitterId,
//       clientRequestId: request.id,
//       message: `Hi! I have just sent a request for the ${request.serviceType} service. Please review and accept it if everything looks good.`,
//     },
//   });



//   const payload = {
//     title: `You have a new request ${request.serviceType}`,
//     body: `You have a new request ${request.serviceType} from ${request.client.firstName + ' ' + request.client.lastName} please accept the request`,
//     type: NotificationType.BOOKING,
//     data: JSON.stringify({
//       requestId: request.id,
//       sitterId: request.sitterId,
//     }),
//     receiverId: request.sitterId
//   }



//   if (sitter?.fcmToken) {
//     await notificationService.sendNotification(sitter?.fcmToken, payload, request.clientId);
//   }



//   //save notification to the courier
//   await notificationService.saveNotification(payload, request.clientId);

//   return request;
// };


const createClientRequestService = async (data: ICreateRequestData) => {
  // Validate sitter
  const sitter = await prisma.user.findFirst({
    where: { id: data.sitterId, role: 'Sitter', status: 'ACTIVE' },
  });
  if (!sitter) throw new ApiError(httpStatus.NOT_FOUND, 'Sitter not found or inactive');

  // Validate dogs
  const dogs = await prisma.dog.findMany({ where: { id: { in: data.dogIds } } });
  if (dogs.length !== data.dogIds.length)
    throw new ApiError(httpStatus.NOT_FOUND, 'One or more Dog IDs are invalid');

  // Create client request
  const request = await prisma.clientRequest.create({
    data: {
      clientId: data.clientId,
      sitterId: data.sitterId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      serviceType: data.serviceType,
      price: data.price,
      totalPrice: data.totalPrice,
    },
    include: { client: true, sitter: true, dogs: { include: { dog: true } } },
  });

  // Link dogs via pivot
  await prisma.requestDog.createMany({
    data: data.dogIds.map((dogId) => ({ requestId: request.id, dogId })),
  });

  // Create chat
  await prisma.chat.create({
    data: {
      senderId: request.clientId,
      receiverId: request.sitterId,
      clientRequestId: request.id,
      message: `Hi! I have just sent a request for ${request.serviceType}. Please review and accept it.`,
    },
  });

  // Notification
  const payload = {
    title: `New request: ${request.serviceType}`,
    body: `${request.client.firstName} ${request.client.lastName} sent you a request.`,
    type: NotificationType.BOOKING,
    data: JSON.stringify({ requestId: request.id, sitterId: request.sitterId }),
    receiverId: request.sitterId,
  };

  if (sitter.fcmToken) await notificationService.sendNotification(sitter.fcmToken, payload, request.clientId);
  await notificationService.saveNotification(payload, request.clientId);

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
console.log(sitterId, "sitterId");
  // Fetch all requests for sitter with related data
  const allRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymentStatus.COMPLETED,
    },
    include: {
      // sitter: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true,
          email: true,
        }
      },
      dogs: {
        include: {
          dog: {
            select: {
              name: true,
              breed: true,
              images: true,
            }
          }
        }
      },
      // dog: true, // uncomment if needed
    },
  });

  console.log(allRequests, "allRequests");

  const ongoingRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymentStatus.COMPLETED,
      status: "ONGOING",
    },
    include: {

      client: true,
      dogs: true,

    },
  });

  const upComeingRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymentStatus.COMPLETED,
      status: "ACCEPTED",
      // endTime: {
      //   gt: nowTime,
      // },
    },
    include: {
      client: true,
      dogs: true,
    },
  });
  const completedRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      paymentStatus: PaymentStatus.COMPLETED,
      status: "COMPLETED",
      // endTime: {
      //   gt: nowTime,
      // },
    },
    include: {
      client: true,
      dogs: true,
    },
  });



  return { allRequests, ongoingRequests, upComeingRequests, completedRequests };
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
    include: {
      client: true,
      sitter: true
    }
  });

  if (!serviceRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service request not found');
  }

  if (status === RequestStatus.ONGOING && serviceRequest.paymentStatus !== PaymentStatus.COMPLETED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status!. Service request is not completed Not payment yet');
  }


  if (status === RequestStatus.COMPLETED && serviceRequest.paymentStatus !== PaymentStatus.COMPLETED) {
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

  let title = "";
  let body = "";
  const serviceType = serviceRequest.serviceType;
  const sitterName = serviceRequest.sitter?.firstName + " " + serviceRequest.sitter?.lastName

  switch (status) {
    case "ACCEPTED":
      title = `Your ${serviceType} request has been ACCEPTED`;
      body = `Your request for ${serviceType} has been accepted by ${sitterName}. Please proceed with the payment to confirm the service.`;
      break;

    case "COMPLETED":
      title = `Your ${serviceType} request has been COMPLETED`;
      body = `Your request for ${serviceType} has been completed by ${sitterName}. Payment is completed.`;
      break;

    case "ONGOING":
      title = `Your ${serviceType} request is ONGOING`;
      body = `Your ${serviceType} service with ${sitterName} is currently ongoing.`;
      break;

    case "DENIED":
      title = `Your ${serviceType} request has been DENIED`;
      body = `Unfortunately, your request for ${serviceType} was denied by ${sitterName}. You may request another sitter.`;
      break;

    default:
      throw new Error(
        "Cannot update status! Status must be ACCEPTED, COMPLETED, ONGOING or DENIED"
      );
  }

  const payload = {
    title,
    body,
    type: NotificationType.BOOKING,
    data: JSON.stringify({
      requestId: serviceRequest.id,
      sitterId: serviceRequest.sitterId,
    }),
    receiverId: serviceRequest.client.id,
  };


  if (serviceRequest?.client?.fcmToken) {
    await notificationService.sendNotification(
      serviceRequest?.client?.fcmToken,
      payload,
      serviceRequest.sitter.id
    );
  }

  //save notification to the courier
  await notificationService.saveNotification(
    payload,
    serviceRequest.sitter.id
  );




  return result;
};

// getAllUpcomingAndOngoingCleintServices

const getAllUpcomingAndOngoingCleintServices = async (clientId: string) => {

  const nowTime = new Date()

  // // Fetch all requests for sitter with related data
  // const allRequests = await prisma.clientRequest.findMany({
  //   where: {
  //     clientId,
  //     paymentStatus: PaymentStatus.COMPLETED,
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
      paymentStatus: PaymentStatus.COMPLETED,
      status: "ONGOING",
    },
    include: {

      client: true,
      dogs: true,

    },
  });
  const upComeingRequests = await prisma.clientRequest.findMany({
    where: {
      clientId,
      paymentStatus: PaymentStatus.COMPLETED,
      status: {
        notIn: ["PENDING", "DENIED", "COMPLETED", "ONGOING"],
      },
      endTime: {
        gt: nowTime,
      },
    },
    include: {
      client: true,
      dogs: true,
    },
  });

  const completedRequests = await prisma.clientRequest.findMany({
    where: {
      clientId,
      paymentStatus: PaymentStatus.COMPLETED,
      status: "COMPLETED",
    },
    include: {
      client: true,
      dogs: true,
    },
  });



  return { ongoingRequests, upComeingRequests, completedRequests };
}

// get clinet and dog details by request id

const getClinetAndDogProfileById = async (requestId: string) => {

  if (!requestId) {
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
     dogs: {
       include: {
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
       }
      }
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


const createReviewCinetAndDog = async ({ requestId, client, dog }: { requestId: string, client: IClinetRating, dog: IDogRating }) => {

  if (!requestId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }
  if (!client) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! client not found');
  }
  if (!dog) {
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
          fcmToken: true,
          email: true,
          createdAt: true,
          phone: true,
          address: true,
        }
      },
      dogs: {
       include: {
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
      ratingsGivenId: serviceReuestData.sitterId,
      ratingsReceivedId: serviceReuestData.clientId,
    },
  })


  // const dogReview = await prisma.petRating.create({
  //   data: {
  //     review: dog.review,
  //     rating: dog.rating,
  //     ratingsGivenId: serviceReuestData.clientId,
  //     ratingsReceivedId: serviceReuestData.dogId,
  //   },
  // })



  const sitterReviewPayload = {
    title: `You have received a new review`,
    body: `${serviceReuestData.client.firstName} ${serviceReuestData.client.lastName} rated you ${client.rating} stars with a comment: "${client.review}"`,
    type: NotificationType.GENERAL,
    data: JSON.stringify({
      requestId: requestId,
      sitterId: serviceReuestData.sitterId,
      rating: client.rating,
    }),
    receiverId: serviceReuestData.clientId,
  };


  if (serviceReuestData.client?.fcmToken) {
    await notificationService.sendNotification(
      serviceReuestData.client?.fcmToken,
      sitterReviewPayload,
      serviceReuestData.clientId
    );
  }

  //save notification to the courier
  await notificationService.saveNotification(
    sitterReviewPayload,
    serviceReuestData.clientId
  );


  return {
    clientReviwe,
    // dogReview
  }


};


const getAllAcceptedRequests = async (sitterId: string) => {

  if (!sitterId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }


  const result = await prisma.clientRequest.findMany({
    where: {
      sitterId: sitterId,
      status: RequestStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING
    },
    include: {
      client: true,
    },
  });
  return result;
}



const getAcceptServiceForPayment = async (clientId: string) => {
  if (!clientId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot get! unauthorized request');
  }

  // Fetch all requests for sitter with related data
  const pendingServices = await prisma.clientRequest.findMany({
    where: {
      clientId: clientId,
      status: RequestStatus.ACCEPTED,
      paymentStatus: PaymentStatus.PENDING
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

  const ongoingServices = await prisma.clientRequest.findMany({
    where: {
      clientId: clientId,
      status: RequestStatus.ONGOING,
      paymentStatus: PaymentStatus.COMPLETED
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

  const upcommingServices = await prisma.clientRequest.findMany({
    where: {
      clientId: clientId,
      status: RequestStatus.ACCEPTED,
      paymentStatus: PaymentStatus.COMPLETED
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

  const completedServices = await prisma.clientRequest.findMany({
    where: {
      clientId: clientId,
      status: RequestStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED
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



  return { pendingServices, ongoingServices, upcommingServices, completedServices };
};

const denyClinerRequest = async (requestId: string, clientId: string) => {
  const result = await prisma.user.updateMany({
    where: {
      id: clientId
    },
    data: {
      deniedServices: {
        push: requestId
      }
    }
  })
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
  getAcceptServiceForPayment,
  denyClinerRequest

};