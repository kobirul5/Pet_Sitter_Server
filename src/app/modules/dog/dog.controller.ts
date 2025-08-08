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


export const dogController = {
  createDogProfile,

};