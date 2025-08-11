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
// Get service requests by siiterId for sitter
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

// get clinet and dog profile by id
 router.get(
  "/clinet-and-dog/:requestid",
  auth(),
  serviceReuestController.getClinetAndDogProfileByIdController
);

export const serviceReuestRoutes = router;