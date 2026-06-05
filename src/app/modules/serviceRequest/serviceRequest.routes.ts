import express from "express";
import auth from "../../middlewares/auth";
import { serviceRequestController } from "./serviceRequest.controller";

const router = express.Router();

router.post(
  "/send-request",
  auth(),
  serviceRequestController.createClientRequestController
);

router.get("/", auth(), serviceRequestController.getServiceRequestsController);
// Get service requests by siiterId for sitter
router.get(
  "/sitter",
  auth(),
  serviceRequestController.getServiceRequestsForSitterController
);

router.put(
  "/update-status",
  auth(),
  serviceRequestController.updateServiceStatusController
);

// get all accepted request
router.get(
  "/accepted-requests-for-client",
  auth(),
  serviceRequestController.getAllAcceptedRequests
);

// get all upcoming and ongoing request
router.get(
  "/upcoming-and-ongoing-requests-for-client",
  auth(),
  serviceRequestController.getAllUpcomingAndOngoingClientRequests
);


// get client and dog profile by id
router.get(
  "/client-and-dog/:requestid",
  auth(),
  serviceRequestController.getClientAndDogProfileByIdController
);

// create review client and dog
router.post(
  "/review-client-and-dog",
  auth(),
  serviceRequestController.createReviewClientAndDogController
);

// accept client request
router.patch(
  "/accept-request/:id",
  auth(),
  serviceRequestController.acceptClientRequestController
);

// accpepted services for payment
router.get(
  "/accept-service-payment",
  auth(),
  serviceRequestController.getAcceptServiceForPaymentController
);

router.put(
  "/deny-request/:id",
  auth(),
  serviceRequestController.denyClientRequestController
);

export const serviceRequestRoutes = router;
