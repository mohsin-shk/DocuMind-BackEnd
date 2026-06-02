import path from "path";
import { Document } from "../models/document.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "../configs/cloudinary.js";
import fs from "fs";
import { extractText } from "../ai/extractText.js";
import { chunkText } from "../utils/chunkText.js";
import { generateEmbeddings } from "./embedding.service.js";
import { upsertDocumentEmbeddings,deleteDocumentEmbeddings } from "./pinecone.service.js";
import {checkAndIncrementDocumentUsage,decrementDocumentUsage,} from "./usage.service.js";

/*
========================================
UPLOAD DOCUMENT SERVICE
========================================
*/

const uploadDocument = async ({ uploadedFile, ownerId, title, }) => {
  /*
========================================
VALIDATE INPUTS
========================================
*/

  if (!uploadedFile) {
    throw new ApiError(
      400,
      "Document file is required"
    );
  }

  if (!ownerId) {
    throw new ApiError(
      400,
      "Document owner is required"
    );
  }

  /*
 ========================================
 EXTRACT FILE METADATA
 ========================================
 */
  const originalFileName = uploadedFile.originalname;

  const fileExtension = path
    .extname(originalFileName)
    .replace(".", "")
    .toLowerCase();

  /*
  ========================================
  GENERATE DOCUMENT TITLE
  ========================================
  */

  const documentTitle =
    title?.trim() ||
    path.parse(originalFileName).name;
  
  /*
    ========================================
    CHECK DOCUMENT LIMIT BEFORE ANYTHING
    ========================================
    */

  await checkAndIncrementDocumentUsage(ownerId);

  let cloudinaryResponse = null;
  let document = null

  try {
    /*
    ========================================
    UPLOAD FILE TO CLOUDINARY
    ========================================
    */
    cloudinaryResponse = await uploadFileToCloudinary(
      uploadedFile.path
    );

    if (!cloudinaryResponse?.secure_url || !cloudinaryResponse?.public_id) {
      throw new ApiError(
        500,
        "Failed to upload document"
      );
    }

    /*
    ========================================
    CREATE DOCUMENT RECORD
    ========================================
    */

     document = await Document.create({
      owner: ownerId,
      title: documentTitle,
      originalFileName,
      fileExtension,
      mimeType: uploadedFile.mimetype,
      fileSize: uploadedFile.size,
      storage: {
        provider: "cloudinary",
        url: cloudinaryResponse.secure_url || cloudinaryResponse.url,
        publicId: cloudinaryResponse.public_id,
      },
      processingStatus: "uploaded",
    })

    
    /*
    ========================================
    PROCESS DOCUMENT
    ========================================
    */
    await processDocument({
      documentId: document._id,

      localFilePath:
        uploadedFile.path,
    });

    /*
    ========================================
    FETCH UPDATED DOCUMENT
    ========================================
    */

    const processedDocument =
      await Document.findById(
        document._id
      );

    if (!processedDocument) {
      throw new ApiError(
        500,
        "Failed to fetch processed document"
      );
    }

    /*
    ========================================
    RETURN PROCESSED DOCUMENT
    ========================================
    */

    return processedDocument;

  } catch (error) {
    /*
        ========================================
        ROLL BACK DOCUMENT COUNTER ON FAILURE
        ========================================
        */
      await decrementDocumentUsage(ownerId);

    /*
  ========================================
  CLEANUP CLOUDINARY FILE
  ========================================
  */

    if (
      cloudinaryResponse?.public_id && !document
    ) {
      await deleteFileFromCloudinary(
        cloudinaryResponse.public_id
      );
    }

    /*
    ========================================
    THROW ERROR
    ========================================
    */

    throw error;
  }

}


const processDocument = async ({ documentId, localFilePath, }) => {
  /*
  ========================================
  VALIDATE INPUT
  ========================================
  */

  if (
    !documentId ||
    !localFilePath
  ) {
    throw new ApiError(
      400,
      "Document ID and local file path are required"
    );
  }

  let document = null;

  try {

    /*
   ========================================
   FETCH DOCUMENT
   ========================================
   */

    document =
      await Document.findById(
        documentId
      );

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    /*
    ========================================
    UPDATE STATUS → PROCESSING
    ========================================
    */

    document.processingStatus =
      "processing";

    document.processingError = "";

    await document.save();

    /*
    ========================================
    EXTRACT TEXT
    ========================================
    */

    const extractionResult =
      await extractText({
        mimeType:
          document.mimeType,

        filePath: localFilePath,
      });

    /*
    ========================================
    STORE EXTRACTED TEXT
    ========================================
    */

    document.extractedText = extractionResult.text;

    document.pageCount = extractionResult.metadata?.pageCount || 0;

    await document.save();

    /*
    ========================================
    CHUNK TEXT
    ========================================
    */

    const { chunks, metadata: chunkMetadata } = await chunkText({
      text: extractionResult.text,
    });

    /*
    ========================================
    GENERATE EMBEDDINGS
    ========================================
    */

    const embeddedChunks =
      await generateEmbeddings(
        chunks
      );
    
    
    /*
    ========================================
    STORE VECTORS IN PINECONE
    ========================================
    */

    const vectorResult =
      await upsertDocumentEmbeddings({
        ownerId:
          document.owner,

        documentId:
          document._id,

        title:
          document.title,

        embeddedChunks,
      });

    /*
   ========================================
   UPDATE DOCUMENT STATUS
   ========================================
   */

    document.processingStatus =
      "ready";

    document.vectorNamespace =
      vectorResult.namespace;

    document.chunkCount =
      embeddedChunks.length;

    document.processedAt =
      new Date();

    await document.save();

    /*
    ========================================
    CLEANUP TEMP FILE
    ========================================
    */

    if (
      fs.existsSync(localFilePath)
    ) {
      fs.unlinkSync(localFilePath);
    }


    /*
   ========================================
   RETURN DOCUMENT
   ========================================
   */

    return document;

  } catch (error) {

    /*
    ========================================
    UPDATE FAILURE STATUS
    ========================================
    */

    if (document) {
      document.processingStatus =
        "failed";

      document.processingError =
        error.message;

      await document.save();
    }

    /*
    ========================================
    CLEANUP TEMP FILE
    ========================================
    */

    if (
      localFilePath &&
      fs.existsSync(localFilePath)
    ) {
      fs.unlinkSync(localFilePath);
    }

    throw error;
  }

}

/*
========================================
GET USER DOCUMENTS
========================================
*/

const getUserDocuments = async (ownerId) => {
    if (!ownerId) {
        throw new ApiError(400, "Owner ID is required");
    }

    const documents = await Document.find({
        owner: ownerId,
        isDeleted: false,
    })
        .select("-extractedText") 
        .sort({ createdAt: -1 });

    return documents;
};

/*
========================================
GET SINGLE DOCUMENT
========================================
*/

const getDocument = async ({ ownerId, documentId }) => {
    if (!ownerId || !documentId) {
        throw new ApiError(400, "Owner ID and document ID are required");
    }

    const document = await Document.findOne({
        _id: documentId,
        owner: ownerId,
        isDeleted: false,
    }).select("-extractedText");

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    return document;
};

/*
========================================
DELETE DOCUMENT
========================================
*/

const deleteDocument = async ({ ownerId, documentId }) => {
    if (!ownerId || !documentId) {
        throw new ApiError(400, "Owner ID and document ID are required");
    }

    /*
    ========================================
    FETCH DOCUMENT
    ========================================
    */

    const document = await Document.findOne({
        _id: documentId,
        owner: ownerId,
        isDeleted: false,
    });

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    /*
    ========================================
    DELETE FROM CLOUDINARY
    ========================================
    */

    if (document.storage?.publicId) {
        await deleteFileFromCloudinary(
            document.storage.publicId
        ).catch((err) => {
            console.warn(
                `Cloudinary deletion failed for publicId ${document.storage.publicId}:`,
                err.message
            );
        });
    }

    /*
    ========================================
    DELETE VECTORS FROM PINECONE
    ========================================
    */

    if (
        document.chunkCount > 0 &&
        document.vectorNamespace
    ) {
        await deleteDocumentEmbeddings({
            ownerId,
            documentId,
            chunkCount: document.chunkCount,
        }).catch((err) => {
            console.warn(
                `Pinecone deletion failed for document ${documentId}:`,
                err.message
            );
            console.warn("Full error:", err);
        });
    }

    /*
    ========================================
    DECREMENT USAGE COUNTER
    ========================================
    */

    await decrementDocumentUsage(ownerId);

    /*
    ========================================
    HARD DELETE DOCUMENT RECORD
    ========================================
    */

    await Document.findByIdAndDelete(document._id);

    return document;
};


export { uploadDocument, getUserDocuments ,getDocument,deleteDocument, };