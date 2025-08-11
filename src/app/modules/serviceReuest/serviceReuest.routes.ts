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
router.get(
  "/sitter",
  auth(),
  serviceReuestController.getServiceRequestsForSitterController
);

router.put(
  "/update-status",
  auth(),
  serviceReuestController.updateServicestatusController
);


export const serviceReuestRoutes = router;