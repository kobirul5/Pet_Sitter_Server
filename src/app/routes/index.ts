import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";
import { SitterRoutes } from "../modules/Sitter/sitter.routes";
import { dogRoutes } from "../modules/dog/dog.routes";
import { serviceReuestRoutes } from "../modules/serviceReuest/serviceReuest.routes";
import { ChatRoutes } from "../modules/chatImage/chat.route";
import path from "path";
import { reviewRoutes } from "../modules/review/review.routes";

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
    route: serviceReuestRoutes,
  },
  {
    path: "/chats",
    route: ChatRoutes
  },
  {
    path: "/reviews",
    route: reviewRoutes
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
