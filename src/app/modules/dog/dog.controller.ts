import httpStatus from 'http-status';
import { dogService } from './dog.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { json } from 'stream/consumers';
import ApiError from '../../../errors/ApiErrors';

const createDogProfile = catchAsync(async (req, res) => {

  const user = req.user;

  if(!req.body.data){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Data is required');
  }
  const data = JSON.parse(req.body.data);

 const files = req.files as { [fieldname: string]: Express.Multer.File[] };


  const result = await dogService.createIntoDb({ userId: user.id, data, files });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Dog Profile created successfully',
    data: result,
  });
});

const getDogList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await dogService.getDogList(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dog list retrieved successfully',
    data: result,
  });
});


const dogDeleteController = catchAsync(async (req, res) => {
  const dogId = req.params.dogId;
  console.log(dogId);
  const result = await dogService.deleteDog(dogId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dog deleted successfully',
    data: null,
  });
});

export const dogController = {
  createDogProfile,
  getDogList,
  dogDeleteController

};