import {
  createChat,
  sendMessage,
  getChatMessages,
  getUserChats,
  deleteChat,
} from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


/*
========================================
CREATE CHAT
========================================
*/

const createChatController =
  asyncHandler(async (
    req,
    res
  ) => {
    const { title, documentIds } =
      req.body;

    const chat =
      await createChat({
        ownerId: req.user._id,

        title,

        documentIds,
      });

    return res.status(201).json(
      new ApiResponse(
        201,
        chat,
        "Chat created successfully"
      )
    );
  });


/*
========================================
SEND MESSAGE
========================================
*/

const sendMessageController =
  asyncHandler(async (
    req,
    res
  ) => {
    const { chatId } = req.params;

    const { content } = req.body;

    const response =
      await sendMessage({
        ownerId: req.user._id,

        chatId,

        content,
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        response,
        "Message sent successfully"
      )
    );
  });

/*
========================================
GET CHAT MESSAGES
========================================
*/

const getChatMessagesController =
  asyncHandler(async (
    req,
    res
  ) => {
    const { chatId } = req.params;

    const messages =
      await getChatMessages({
        ownerId: req.user._id,

        chatId,
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        messages,
        "Chat messages fetched successfully"
      )
    );
  });

/*
========================================
GET USER CHATS
========================================
*/

const getUserChatsController =
  asyncHandler(async (
    req,
    res
  ) => {
    const chats =
      await getUserChats(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        chats,
        "Chats fetched successfully"
      )
    );
  });

/*
========================================
DELETE CHAT
========================================
*/

const deleteChatController =
  asyncHandler(async (
    req,
    res
  ) => {
    const { chatId } = req.params;

    const deletedChat =
      await deleteChat({
        ownerId: req.user._id,

        chatId,
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        deletedChat,
        "Chat deleted successfully"
      )
    );
  });

export {
  createChatController,
  sendMessageController,
  getChatMessagesController,
  getUserChatsController,
  deleteChatController,
};