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

// get all accepted request 
router.get(
  "/accepted-requests-for-client",
  auth(),
  serviceReuestController.getAllAcceptedRequests
)

// get all upcoming and ongoing request 
router.get(
  "/upcoming-and-ongoing-requests-for-client",
  auth(),
  serviceReuestController.getAllUpcomingAndOngoingCleintRequests
)

// const updateOngoingStatus

// get clinet and dog profile by id
 router.get(
  "/clinet-and-dog/:requestid",
  auth(),
  serviceReuestController.getClinetAndDogProfileByIdController
);

// create review client and dog
router.post(
  "/review-client-and-dog",
  auth(),
  serviceReuestController.createReviewCinetAndDogController
);


// accept clinet request
router.patch(
  "/accept-request/:id",
  auth(),
  serviceReuestController.acceptClinerRequestController
);


// accpepted services for payment
router.get(
  "/accept-service-payment",
  auth(),
  serviceReuestController.getAcceptServiceForPaymentController
);


export const serviceReuestRoutes = router;