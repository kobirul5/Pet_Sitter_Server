import express from "express";
import { SitterController } from "./sitter.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

// Get sitter recommendations with filters
router.get(
  "/recommendations",
  auth(),
  SitterController.getSitterRecommendations
);

// Get sitter services for boarding
router.get(
  "/sitter/boarding-services",
  auth(),
  SitterController.getSitterServicesForBoarding
);

// get sitter services for walk
router.get(
  "/sitter/walk-services",
  auth(),
  SitterController.getSitterServicesForWalkingController
);

router.get(
  "/sitter/all-services",
  auth(),
  SitterController.getAllSitterForServices
);

 // get sitter services for DAYCARE
router.get(
  "/sitter/dog-care-services",
  auth(),
  SitterController.getSitterServicesForDogCareController
);

// Get sitter details by ID
router.get(
  "/:sitterId",
  auth(),
  SitterController.getSitterDetails
);

// Rate a sitter
router.post(
  "/rate",
  auth(),
  SitterController.rateSitter
);


export const SitterRoutes = router; 