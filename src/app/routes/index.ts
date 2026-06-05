import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";
import { SitterRoutes } from "../modules/Sitter/sitter.routes";
import { dogRoutes } from "../modules/dog/dog.routes";
import { serviceRequestRoutes } from "../modules/serviceRequest/serviceRequest.routes";
import { ChatRoutes } from "../modules/chatImage/chat.route";
import path from "path";
import { reviewRoutes } from "../modules/review/review.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
// import { paymentRoutes } from "../modules/payment/payment.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/sitters",
    route: SitterRoutes,
  },
  {
    path: "/dogs",
    route: dogRoutes,
  },
  {
    path: "/service-requests",
    route: serviceRequestRoutes,
  },
  {
    path: "/chats",
    route: ChatRoutes
  },
  {
    path: "/reviews",
    route: reviewRoutes
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
