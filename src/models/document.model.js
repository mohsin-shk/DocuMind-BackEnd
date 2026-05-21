import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema({
  /*
  ========================================
  DOCUMENT OWNERSHIP
  ========================================
  */
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  /*
  ========================================
  DOCUMENT BASIC INFO
  ========================================
  */

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  
  originalFileName: {
    type: String,
    required: true,
    trim: true,
  },

  fileExtension: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  mimeType: {
    type: String,
    required: true,
    trim: true,
  },

  fileSize: {
    type: Number,
    required: true,
  },

  pageCount: {
    type: Number,
    default: 0,
  },

  /*
  ========================================
  FILE STORAGE INFO
  ========================================
  */

  storage: {
    provider: {
      type: String,
      enum: ["cloudinary"],
      default: "cloudinary",
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },
  },

  /*
  ========================================
  AI PROCESSING STATUS
  ========================================
  */

  processingStatus: {
    type: String,
    enum: [
      "uploaded",
      "processing",
      "ready",
      "failed",
      "deleted",
    ],
    default: "uploaded",
    index: true,
  },

  processingError: {
    type: String,
    default: "",
  },

  /*
  ========================================
  EXTRACTED CONTENT
  ========================================
  */

  extractedText: {
    type: String,
    default: "",
  },

  /*
  ========================================
  VECTOR DATABASE INFO
  ========================================
  */

  vectorNamespace: {
    type: String,
    default: "",
  },

  /*
  ========================================
  PROCESSING TIMESTAMPS
  ========================================
  */

  processedAt: {
    type: Date,
  },

  /*
  ========================================
  SOFT DELETE
  ========================================
  */

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
}
)

/*
========================================
COMPOUND INDEXES
========================================
*/

documentSchema.index({
  owner: 1,
  createdAt: -1,
});

documentSchema.index({
  owner: 1,
  processingStatus: 1,
});

export const Document = mongoose.model("Document", documentSchema)