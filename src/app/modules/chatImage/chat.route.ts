import express from 'express';
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import { ChatController } from './chat.controller';



const router = express.Router();
// Upload chat images
router.post(
  '/upload-images',
  auth(),
  fileUploader.uploadMultipleImage,
  ChatController.uploadChatImages
);

export const ChatRoutes = router; 