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

 // get sitter services for dog care
router.get(
  "/sitter/dog-care-services",
  auth(),
  SitterController.getSitterServicesForDogCareController
);

// router.get(
//   "/onboarding",
//   auth(),
//   SitterController.getSitterBoarding
// )

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



// // Update sitter rating
// router.patch(
//   "/:sitterId/rate",
//   auth(),
//   SitterController.updateSitterRating
// );

// // Delete sitter rating
// router.delete(
//   "/:sitterId/rate",
//   auth(),
//   SitterController.deleteSitterRating
// );

// // Get user's ratings
// router.get(
//   "/ratings/my",
//   auth(),
//   SitterController.getUserRatings
// );




export const SitterRoutes = router; 