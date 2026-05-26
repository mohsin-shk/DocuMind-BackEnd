import mongoose, {Schema} from "mongoose";

/*
========================================
CHAT SCHEMA
========================================
*/

const chatSchema =  new Schema({
    /*
    ========================================
    CHAT OWNER
    ========================================
    */
    owner: {
      type:Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    ========================================
    CHAT TITLE
    ========================================
    */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    /*
    ========================================
    LINKED DOCUMENTS
    ========================================
    */

    documents: [
      {
        type:Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    /*
    ========================================
    LAST MESSAGE TIMESTAMP
    ========================================
    */
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
},{
    timestamps:true,
}
)

/*
========================================
EXPORT MODEL
========================================
*/

export const Chat = mongoose.model("Chat",chatSchema);