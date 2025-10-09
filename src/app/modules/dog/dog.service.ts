import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { fileUploader } from '../../../helpars/fileUploader';
import { deleteImageFromDigitalOcean } from '../../../helpars/fileDelete';
import { UserRole } from '@prisma/client';



interface Dog {
  name?: string;
  gender?: string;
  age?: string;
  breed?: string;
  weight?: string;
  vaccination?: string;
  spayed?: string;
  about?: string;
}



interface IDog {data: Dog, files:{ [fieldname: string]: Express.Multer.File[] }, userId: string}


const createIntoDb = async ({data, files, userId}:IDog) => {

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if(!user){
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found')
  }
  if(!data){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Data not found')
  }
  
  if(user.role === UserRole.Sitter){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Sitter can not create dog profile')
  }

  if (!files || !files.images || files.images.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No images provided");
  }

  const uploadPromises = files.images.map(file => fileUploader.uploadToDigitalOcean(file));
  const uploadedImages = await Promise.all(uploadPromises);

  const imageUrls = uploadedImages.map(img => img.Location);
    if (imageUrls.length === 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload images");
    }

    const result = await prisma.dog.create({
      data:{
        name: data.name,
        gender: data.gender,
        age: data.age,
        breed: data.breed,
        weight: data.weight,
        vaccination: data.vaccination,
        spayed: data.spayed,
        about: data.about,
        userId: userId,
        images: imageUrls
      }
    })
    if(!result){
      throw new ApiError(httpStatus.BAD_REQUEST, 'Dog not created')
    }

  return result 
};


const getDogList = async (userId: string) => {
  const result = await prisma.dog.findMany({
    where: { userId: userId, status: { not: 'DELETED' } },
  });
  return result;
};


const deleteDog = async (dogId: string, userId: string) => {

  if(!dogId){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Dog id is required')
  }



  const dog = await prisma.dog.findUnique({
    where: { id: dogId },
  });
  if (!dog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dog not found');
  }

  if (dog.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this dog');
  }
  
  const urls: string[] = dog.images || [];

  let deleted

 for (const url of urls) {
   deleted = await deleteImageFromDigitalOcean(url);
  }


  const result = await prisma.dog.update({
    where: { id: dogId },
    data: { status: 'DELETED' },
  });


  return null;
};


export const dogService = {
createIntoDb,
getDogList,
deleteDog
};