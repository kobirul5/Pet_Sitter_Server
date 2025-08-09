import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { ICreateRequestData } from "../Sitter/sitter.interface";

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
      status:{
        notIn: ["PENDING","DENIED"]
      }
    }
  });
  return requests;
};

export const serviceReuestService = {
  createClientRequestService,
  getServiceRequests
};