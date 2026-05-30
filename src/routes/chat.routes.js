import { Router } from "express";
import {
  createChatController,
  sendMessageController,
  getChatMessagesController,
  getUserChatsController,
  deleteChatController,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/*
========================================
CHAT ROUTES
========================================
*/

router.post(
  "/",
  createChatController
);

router.get(
  "/",
  getUserChatsController
);

router.get(
  "/:chatId/messages",
  getChatMessagesController
);

router.post(
  "/:chatId/messages",
  sendMessageController
);

router.delete(
  "/:chatId",
  deleteChatController
);

export default router;