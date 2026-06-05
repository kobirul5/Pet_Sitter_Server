import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { ICreateRequestData } from "../Sitter/sitter.interface";
import { NotificationType,  PaymentStatus,  RequestStatus } from "@prisma/client";

import { notificationService } from "../notification/notification.service";
import { IClientRating, IDogRating } from "./serviceRequest.interface";


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

  const endTime = data.endTime ? new Date(data.endTime) : null;

  // Create client request
  const request = await prisma.clientRequest.create({
    data: {
      clientId: data.clientId,
      sitterId: data.sitterId,
      startTime: new Date(data.startTime),
      endTime: endTime,
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

const getServiceForSitterRequests = async (sitterId: string) => {
  const nowTime = new Date()

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

    },
  });

  const upComingRequests = await prisma.clientRequest.findMany({
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
    },
  });



  return { allRequests, ongoingRequests, upComingRequests, completedRequests };
};

// update service status
const updateServiceStatus = async (requestId: string, status: string, sitterId: string) => {

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

// getAllUpcomingAndOngoingClientServices

const getAllUpcomingAndOngoingClientServices = async (clientId: string) => {

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
  const upComingRequests = await prisma.clientRequest.findMany({
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



  return { ongoingRequests, upComingRequests, completedRequests };
}

// get client and dog details by request id

const getClientAndDogProfileById = async (requestId: string) => {

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

const acceptClientRequest = async (requestId: string, sitterId: string) => {


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


const createReviewClientAndDog = async ({ requestId, client, dog }: { requestId: string, client: IClientRating, dog: IDogRating }) => {

  if (!requestId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
  }
  if (!client) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! client not found');
  }
  if (!dog) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! dog not found');
  }

  const serviceRequestData = await prisma.clientRequest.findUnique({
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

  if (!serviceRequestData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! sitter not found');
  }


  const clientReview = await prisma.rating.create({
    data: {
      review: client.review,
      rating: client.rating,
      ratingsGivenId: serviceRequestData.sitterId,
      ratingsReceivedId: serviceRequestData.clientId,
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
    body: `${serviceRequestData.client.firstName} ${serviceRequestData.client.lastName} rated you ${client.rating} stars with a comment: "${client.review}"`,
    type: NotificationType.GENERAL,
    data: JSON.stringify({
      requestId: requestId,
      sitterId: serviceRequestData.sitterId,
      rating: client.rating,
    }),
    receiverId: serviceRequestData.clientId,
  };


  if (serviceRequestData.client?.fcmToken) {
    await notificationService.sendNotification(
      serviceRequestData.client?.fcmToken,
      sitterReviewPayload,
      serviceRequestData.clientId
    );
  }

  //save notification to the courier
  await notificationService.saveNotification(
    sitterReviewPayload,
    serviceRequestData.clientId
  );


  return {
    clientReview,
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

  const upcomingServices = await prisma.clientRequest.findMany({
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



  return { pendingServices, ongoingServices, upcomingServices, completedServices };
};

const denyClientRequest = async (requestId: string, clientId: string) => {
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

export const serviceRequestService = {
  createClientRequestService,
  getServiceRequests,
  getServiceForSitterRequests,
  updateServiceStatus,
  getClientAndDogProfileById,
  acceptClientRequest,
  createReviewClientAndDog,
  getAllAcceptedRequests,
  getAllUpcomingAndOngoingClientServices,
  getAcceptServiceForPayment,
  denyClientRequest

};
