import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { dogController } from './dog.controller';
import { dogValidation } from './dog.validation';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();

router.post(
'/',
auth(),
fileUploader.uploadMultipleImage,
// validateRequest(dogValidation.createSchema),
dogController.createDogProfile,
);

router.get('/my-pets', auth(), dogController.getDogList);

// router.get('/', auth(), dogController.getDogList);

// router.get('/:id', auth(), dogController.getDogById);

// router.put(
// '/:id',
// auth(),
// validateRequest(dogValidation.updateSchema),
// dogController.updateDog,
// );

// router.delete('/:id', auth(), dogController.deleteDog);

export const dogRoutes = router;