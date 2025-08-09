import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { serviceReuestController } from './serviceReuest.controller';


const router = express.Router();

router.post(
  "/send-request",
  auth(),
  serviceReuestController.createClientRequestController
);

router.get(
  "/",
  auth(),
  serviceReuestController.getServiceRequestsController
);

export const serviceReuestRoutes = router;