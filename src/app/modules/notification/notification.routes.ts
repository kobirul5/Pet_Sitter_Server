// Notification.routes: Module file for the Notification.routes functionality.
import express from "express";
import auth from "../../middlewares/auth";
import { ENUM_USER_ROLE } from "../../../enums/user";
import { checkBlockedStatus } from "../../middlewares/checkBlock";
import { NotificationController } from "./notification.controller";

const router = express.Router();

router.post(
  "/send-to-selected",

  auth(ENUM_USER_ROLE.ADMIN),
  checkBlockedStatus,
  NotificationController.sendNotificationToSelectedUsersController
);

router.post(
  "/send",
  auth(),
  checkBlockedStatus,
  NotificationController.sendNotificationToUser
);

// Get all notifications
router.get(
  "/",
  auth(ENUM_USER_ROLE.ADMIN),
  checkBlockedStatus,
  NotificationController.getAllNotificationsController
);

// Get notifications by user ID
router.get(
  "/get",
  auth(),
  checkBlockedStatus,
  NotificationController.getNotificationByUserIdController
);

// Mark notifications as read by user ID
router.put(
  "/read",
  auth(),
  checkBlockedStatus,
  NotificationController.readNotificationByUserIdController
);

// Delete notification by id
router.delete(
  "/delete/:id",
  auth(),
  checkBlockedStatus,
  NotificationController.deleteNotificationByIdController
);

// Delete all notifications for the authenticated user
router.delete(
  "/delete-all",
  auth(),
  checkBlockedStatus,
  NotificationController.deleteAllNotificationsController
);

export const NotificationRoutes = router;
