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
import {
    createChatLimiter,
    sendMessageLimiter,
    readLimiter,
    deleteLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(requireAuth);

/*
========================================
CHAT ROUTES
========================================
*/

router.post(
  "/",
  createChatLimiter,
  validate(createChatSchema),
  createChatController
);

router.get(
  "/",
  readLimiter,
  getUserChatsController
);

router.get(
  "/:chatId/messages",
  readLimiter,
  validate(
    chatIdParamsSchema,
    "params"
  ),
  getChatMessagesController
);

router.post(
  "/:chatId/messages",
  sendMessageLimiter,
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
  deleteLimiter,
  validate(
    chatIdParamsSchema,
    "params"
  ),
  deleteChatController
);

export default router;