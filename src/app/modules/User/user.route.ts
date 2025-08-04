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
  userImageUpload,
  UserController.updateUser
);

// update profile picture
router.put(
  "/update-profileImage",
  auth(),
  checkBlockedStatus,
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

export const userRoutes = router;
