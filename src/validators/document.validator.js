import { z } from "zod";
import mongoose from "mongoose";

/*
========================================
MONGODB OBJECT ID VALIDATOR
========================================
*/

const objectIdSchema = z
    .string()
    .refine(
        (value) =>
            mongoose.Types.ObjectId.isValid(
                value
            ),
        {
            message:
                "Invalid MongoDB ObjectId",
        }
    );

/*
========================================
UPLOAD DOCUMENT SCHEMA
========================================
*/

const uploadDocumentSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        1,
        "Title cannot be empty"
      )
      .max(
        100,
        "Title cannot exceed 100 characters"
      )
      .optional(),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description cannot exceed 500 characters"
      )
      .optional(),
  });

/*
========================================
CREATE CHAT SCHEMA
========================================
*/

const createChatSchema =
    z.object({
        title: z
            .string()
            .trim()
            .max(
                100,
                "Chat title cannot exceed 100 characters"
            ).optional(),

        documentIds: z
            .array(objectIdSchema)
            .min(1, "At least one document is required to start a chat")
            .max(2, "Cannot select more than 2 documents for a chat"),
            // .default([]),
    });

/*
========================================
SEND MESSAGE SCHEMA
========================================
*/

const sendMessageSchema =
    z.object({
        content: z
            .string()
            .trim()
            .min(
                1,
                "Message content is required"
            )
            .max(
                5000,
                "Message exceeds maximum allowed length"
            ),
    });

/*
========================================
CHAT PARAMS SCHEMA
========================================
*/

const chatIdParamsSchema =
  z.object({
    chatId: objectIdSchema,
  });

const documentIdParamsSchema = z.object({
    documentId: objectIdSchema,
});

export {
    uploadDocumentSchema,
    createChatSchema,
    sendMessageSchema,
    chatIdParamsSchema,
    documentIdParamsSchema,
};