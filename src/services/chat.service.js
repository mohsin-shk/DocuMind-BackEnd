import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { Document } from "../models/document.model.js";
import { ApiError } from "../utils/ApiError.js";
import { askQuestion } from "./rag.service.js";
import { env } from "../configs/env.js";

/*
========================================
CREATE CHAT
========================================
*/

const createChat = async ({
  ownerId,
  title,
  documentIds = [],
}) => {
  /*
  ========================================
  VALIDATE INPUT
  ========================================
  */

  if (!ownerId || !title?.trim()) {
    throw new ApiError(
      400,
      "Owner ID and title are required"
    );
  }

  /*
  ========================================
  VALIDATE DOCUMENT IDS
  ========================================
  */

  if (
    !Array.isArray(documentIds)
  ) {
    throw new ApiError(
      400,
      "documentIds must be an array"
    );
  }

  /*
  ========================================
  REMOVE DUPLICATES
  ========================================
  */

  const uniqueDocumentIds = [
    ...new Set(documentIds),
  ];

  /*
  ========================================
  VALIDATE DOCUMENT OWNERSHIP
  ========================================
  */

  if (
    uniqueDocumentIds.length > 0
  ) {
    const documents =
      await Document.find({
        _id: {
          $in: uniqueDocumentIds,
        },

        owner: ownerId,
      });

    if (
      documents.length !==
      uniqueDocumentIds.length
    ) {
      throw new ApiError(
        403,
        "One or more documents are invalid"
      );
    }
  }

  /*
  ========================================
  CREATE CHAT
  ========================================
  */

  const chat = await Chat.create({
    owner: ownerId,

    title: title.trim(),

    documents:
      uniqueDocumentIds,
  });

  /*
  ========================================
  RETURN CHAT
  ========================================
  */

  return chat;

}

/*
========================================
SEND MESSAGE
========================================
*/

const sendMessage = async ({
  ownerId,
  chatId,
  content,
}) => {
  /*
 ========================================
 VALIDATE INPUT
 ========================================
 */

  if (
    !ownerId ||
    !chatId ||
    !content?.trim()
  ) {
    throw new ApiError(
      400,
      "Owner ID, chat ID and content are required"
    );
  }

  /*
  ========================================
  FETCH CHAT
  ========================================
  */

  const chat =
    await Chat.findOne({
      _id: chatId,

      owner: ownerId,
    });

  if (!chat) {
    throw new ApiError(
      404,
      "Chat not found"
    );
  }

  /*
  ========================================
  STORE USER MESSAGE
  ========================================
  */

  const userMessage =
    await Message.create({
      chat: chat._id,
      role: "user",
      content: content.trim(),
    });

  /*
========================================
FETCH CONVERSATION HISTORY
========================================
*/

  const MAX_HISTORY = 20; // cap at 10 turns (20 messages)

  const priorMessages = await Message.find({
    chat: chat._id,
  }).sort({ createdAt: 1 }).limit(MAX_HISTORY);

  const conversationHistory = priorMessages.map((msg) => ({
    role: msg.role,       // "user" or "assistant"
    content: msg.content,
  }));
  
  const historyWithoutCurrentTurn = conversationHistory.slice(0, -1);

  /*
  ========================================
  START RESPONSE TIMER
  ========================================
  */

  const startTime = Date.now();

  /*
  ========================================
  RUN RAG PIPELINE
  ========================================
  */


  const ragResponse =
    await askQuestion({
      ownerId,
      question: content,
      documentIds: chat.documents || [],
      conversationHistory: historyWithoutCurrentTurn,
    });

  /*
========================================
CALCULATE RESPONSE TIME
========================================
*/

  const responseTime =
    Date.now() - startTime;

  /*
  ========================================
  STORE ASSISTANT MESSAGE
  ========================================
  */

  const assistantMessage =
    await Message.create({
      chat: chat._id,

      role: "assistant",

      content:
        ragResponse.answer,

      sources:
        ragResponse.sources,

      tokenUsage: {
        promptTokens:
          ragResponse
            .tokenUsage
            ?.prompt_tokens || 0,

        completionTokens:
          ragResponse
            .tokenUsage
            ?.completion_tokens ||
          0,

        totalTokens:
          ragResponse
            .tokenUsage
            ?.total_tokens || 0,
      },

      model:
        env.OPENAI_CHAT_MODEL,

      responseTime,
    });
  /*
 ========================================
 UPDATE CHAT ACTIVITY
 ========================================
 */

  chat.lastMessageAt =
    new Date();

  await chat.save();

  /*
  ========================================
  RETURN RESPONSE
  ========================================
  */
  return {
    chatId: chat._id,
    userMessage,
    assistantMessage,
  };
}


/*
========================================
GET CHAT MESSAGES
========================================
*/

const getChatMessages = async ({
  ownerId,
  chatId,
}) => {
  /*
    ========================================
    VALIDATE INPUT
    ========================================
    */

  if (!ownerId || !chatId) {
    throw new ApiError(
      400,
      "Owner ID and chat ID are required"
    );
  }

  /*
  ========================================
  FETCH CHAT
  ========================================
  */

  const chat =
    await Chat.findOne({
      _id: chatId,

      owner: ownerId,
    }).populate({
      path: "documents",

      select:
        "title originalName fileType",
    });

  if (!chat) {
    throw new ApiError(
      404,
      "Chat not found"
    );
  }

  /*
  ========================================
  FETCH MESSAGES
  ========================================
  */

  const messages =
    await Message.find({
      chat: chat._id,
    }).sort({
      createdAt: 1,
    });

  /*
  ========================================
  RETURN CHAT HISTORY
  ========================================
  */

  return {
    chat,

    messages,
  };

}

/*
========================================
GET USER CHATS
========================================
*/

const getUserChats = async (
  ownerId
) => {
  /*
   ========================================
   VALIDATE INPUT
   ========================================
   */

  if (!ownerId) {
    throw new ApiError(
      400,
      "Owner ID is required"
    );
  }

  /*
  ========================================
  FETCH USER CHATS
  ========================================
  */

  const chats = await Chat.find({
    owner: ownerId,
  })
    .populate({
      path: "documents",

      select:
        "title originalName fileType",
    })

    .sort({
      lastMessageAt: -1,
    }).lean();
  
  if (!chats.length) return [];

  /*
    ========================================
    FETCH ALL LATEST MESSAGES IN ONE QUERY
    ========================================
  */
  
  const chatIds = chats.map((chat) => chat._id);

  const latestMessages = await Message.aggregate([
        {
            $match: {
                chat: { $in: chatIds },
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $group: {
                _id: "$chat",            // group by chatId
                role: { $first: "$role" },
                content: { $first: "$content" },
                createdAt: { $first: "$createdAt" },
            },
        },
    ]);
  
  const latestMessageMap = new Map(
        latestMessages.map((msg) => [
            msg._id.toString(),
            {
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
            },
        ])
    );
  
  /*
    ========================================
    FORMAT AND RETURN
    ========================================
    */

    return chats.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        documents: chat.documents,
        documentCount: chat.documents.length,
        lastMessage: latestMessageMap.get(chat._id.toString()) || null,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
    }));


  /*
  ========================================
  ATTACH LAST MESSAGE PREVIEW
  ========================================
  */

  // const formattedChats =
  //   await Promise.all(
  //     chats.map(async (chat) => {
  //       const latestMessage =
  //         await Message.findOne({
  //           chat: chat._id,
  //         })
  //           .sort({
  //             createdAt: -1,
  //           })

  //           .select(
  //             "role content createdAt"
  //           );

  //       return {
  //         _id: chat._id,

  //         title: chat.title,

  //         documents:
  //           chat.documents,

  //         documentCount:
  //           chat.documents.length,

  //         lastMessage:
  //           latestMessage || null,

  //         lastMessageAt:
  //           chat.lastMessageAt,

  //         createdAt:
  //           chat.createdAt,
  //       };
  //     })
  //   );

  /*
========================================
RETURN CHATS
========================================
*/

  // return formattedChats;

}

/*
========================================
DELETE CHAT
========================================
*/

const deleteChat = async ({
  ownerId,
  chatId,
}) => {
  /*
  ========================================
  VALIDATE INPUT
  ========================================
  */

  if (!ownerId || !chatId) {
    throw new ApiError(
      400,
      "Owner ID and chat ID are required"
    );
  }

  /*
  ========================================
  FETCH CHAT
  ========================================
  */

  const chat =
    await Chat.findOne({
      _id: chatId,

      owner: ownerId,
    });

  if (!chat) {
    throw new ApiError(
      404,
      "Chat not found"
    );
  }

  /*
  ========================================
  DELETE MESSAGES
  ========================================
  */

  await Message.deleteMany({
    chat: chat._id,
  });

  /*
  ========================================
  DELETE CHAT
  ========================================
  */
  await Chat.findByIdAndDelete(
    chat._id
  );

  /*
  ========================================
  RETURN DELETED CHAT
  ========================================
  */

  return chat;
}

export { createChat, sendMessage, getChatMessages, getUserChats, deleteChat, };