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

// Update sitter rating
router.patch(
  "/:sitterId/rate",
  auth(),
  SitterController.updateSitterRating
);

// Delete sitter rating
router.delete(
  "/:sitterId/rate",
  auth(),
  SitterController.deleteSitterRating
);

// Get user's ratings
router.get(
  "/ratings/my",
  auth(),
  SitterController.getUserRatings
);

export const SitterRoutes = router; 