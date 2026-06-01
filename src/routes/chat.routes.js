import { Router } from "express";
import {
  createChatController,
  sendMessageController,
  getChatMessagesController,
  getUserChatsController,
  deleteChatController,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import {
  createChatSchema,
  sendMessageSchema,
  chatIdParamsSchema,
} from "../validators/document.validator.js";

const router = Router();

router.use(requireAuth);

/*
========================================
CHAT ROUTES
========================================
*/

router.post(
  "/",
  validate(createChatSchema),
  createChatController
);

router.get(
  "/",
  getUserChatsController
);

router.get(
  "/:chatId/messages",
  validate(
    chatIdParamsSchema,
    "params"
  ),
  getChatMessagesController
);

router.post(
  "/:chatId/messages",
  validate(
    chatIdParamsSchema,
    "params"
  ),
  validate(
    sendMessageSchema,
    "body"
  ),
  sendMessageController
);

router.delete(
  "/:chatId",
  validate(
    chatIdParamsSchema,
    "params"
  ),
  deleteChatController
);

export default router;