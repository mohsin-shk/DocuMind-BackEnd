import mongoose, { Schema, } from "mongoose";

/*
========================================
MESSAGE SCHEMA
========================================
*/

const messageSchema = new Schema({
    /*
    ========================================
    LINKED CHAT
    ========================================
    */

    chat: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
        index: true,
    },

    /*
    ========================================
    MESSAGE ROLE
    ========================================
    */

    role: {
        type: String,
        enum: [
            "user",
            "assistant",
            "system",
        ],
        required: true,
    },

    /*
    ========================================
    MESSAGE CONTENT
    ========================================
    */

    content: {
        type: String,
        required: true,
        trim: true,
    },

    /*
    ========================================
    AI RESPONSE SOURCES
    ========================================
    */

    sources: [
        {
            documentId: {
                type: Schema.Types.ObjectId,
                ref: "Document",
            },
            title: {
                type: String,
            },
            chunkIndex: {
                type: Number,
            },
        },
    ],

    /*
    ========================================
    TOKEN USAGE METRICS
    ========================================
    */

    tokenUsage: {
        promptTokens: {
            type: Number,
            default: 0,
        },
        completionTokens: {
            type: Number,
            default: 0,
        },
        totalTokens: {
            type: Number,
            default: 0,
        },
    },

    /*
    ========================================
    AI MODEL USED
    ========================================
    */

    model: {
        type: String,
        default: "",
    },

    /*
    ========================================
    RESPONSE GENERATION TIME
    ========================================
    */

    responseTime: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
}
)

/*
========================================
EXPORT MODEL
========================================
*/

export const Message = mongoose.model("Message",messageSchema);
