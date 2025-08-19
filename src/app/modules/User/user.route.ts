import express from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";
import { checkBlockedStatus } from "../../middlewares/checkBlock";
import { fileUploader } from "../../../helpars/fileUploader";
import multer from "multer";

const router = express.Router();

// Configure multer for user profile updates
const storage = multer.memoryStorage();
const upload = multer({ storage });
const userImageUpload = upload.fields([{ name: "profileImage", maxCount: 1 }]);

router.get("/profile", auth(), UserController.getMyProfile);

router.get("/all", auth(), UserController.getAllUser);

// update user profile
router.put(
  "/update-profile",
  auth(),
  fileUploader.uploadSingle,
  UserController.updateProfileController
);

// update profile picture
router.put(
  "/update-profileImage",
  auth(),
  fileUploader.uploadSingle,
  UserController.updateProfileImage
);

// toggle notification status
router.patch(
  "/toggle-notification-status",
  auth(),
  UserController.toggleNotificationOnOff
);

// toggle notification status
router.patch(
  "/toggle-online-status",
  auth(),
  UserController.toggleAvailableOnOff
);

// Sitter profile routes
router.patch(
  "/sitter/profile",
  auth(),
  UserController.updateSitterProfile
);

router.patch(
  "/sitter/profile-details",
  auth(),
  UserController.updateSitterProfileDetails
);

// Sitter services routes : done
router.post(
  "/sitter/services",
  auth(),
  UserController.addSitterService
);

router.get(
  "/sitter/services",
  auth(),
  UserController.getSitterServices
);

router.patch(
  "/sitter/services/:serviceId",
  auth(),
  UserController.updateSitterService
);

router.delete(
  "/sitter/services/:serviceId",
  auth(),
  UserController.deleteSitterService
);

router.patch(
  "/change-sitter-service",
  auth(),
  UserController.changeSitterController
)

export const userRoutes = router;
