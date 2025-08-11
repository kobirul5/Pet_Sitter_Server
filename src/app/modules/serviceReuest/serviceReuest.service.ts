import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { ICreateRequestData } from "../Sitter/sitter.interface";
import { RequestStatus } from "@prisma/client";

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
  const nowTime = new Date().toDateString();

  // Fetch all requests for sitter with related data
  const allRequests = await prisma.clientRequest.findMany({
    where: {
      sitterId,
      status: {
        notIn: ["PENDING", "DENIED"],
      },
    },
    include: {
      sitter: true,
      client: true,
      // dog: true, // uncomment if needed
    },
  });

  // Then filter in JS for ongoing, upcoming, past

  const ongoing = allRequests.filter(
    (req) =>
      req.status === "ACCEPTED" &&
      req.startTime.toDateString() <= nowTime &&
      req.endTime.toDateString() >= nowTime
  );

  // console.log("ongoing", ongoing, allRequests);
  console.log(nowTime)

  const upcoming = allRequests.filter(
    (req) =>
      req.status === "ACCEPTED" &&
      req.startTime.toDateString() > nowTime
  );

  const past = allRequests.filter(
    (req) =>
      req.status === "COMPLETED" &&
      req.endTime.toDateString() < nowTime
  );

  return allRequests;
};

// update service status
const updateServicestatus = async (requestId: string, status: string, sitterId: string) => {

if(status !== RequestStatus.ACCEPTED && status !== RequestStatus.DENIED && status !== RequestStatus.COMPLETED){
  throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status!. Status must be ACCEPTED , COMPLETED or DENIED');
}

 if( !sitterId ){
  throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status! unauthorized request');
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

// get clinet and dog details by request id

const getClinetAndDogProfileById = async (requestId: string) => {


  const result = await prisma.clientRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      client: {
       select:{
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
        select:{
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


export const serviceReuestService = {
  createClientRequestService,
  getServiceRequests,
  getServiceForSitterRequests,
  updateServicestatus,
  getClinetAndDogProfileById
};