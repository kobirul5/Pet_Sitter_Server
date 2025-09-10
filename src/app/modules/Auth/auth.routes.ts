import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "../User/user.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { checkBlockedStatus } from "../../middlewares/checkBlock";

const router = express.Router();

// user login route
router.post("/register", AuthController.createUser);

// user login route
router.post("/login", AuthController.loginUser);

// user logout route
router.post("/logout", AuthController.logoutUser);

//change password
router.put(
  "/change-password",
  auth(),
  AuthController.changePassword
);

//reset password
router.post("/reset-password", AuthController.resetPassword);

//forgot password
router.post("/forgot-password", AuthController.forgotPassword);

//resend otp
router.post("/resend-otp", AuthController.resendOtp);

//verify-otp
router.post("/verify-otp", AuthController.verifyForgotPasswordOtp);

//delete user
router.delete("/delete-user", auth(), AuthController.deleteUser);

router.post(
  "/email-verification-otp",
  // auth(),
  AuthController.sendEmailVerificationOtp 
)

export const AuthRoutes = router;
