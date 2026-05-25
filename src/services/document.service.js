import path from "path";
import { Document } from "../models/document.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "../configs/cloudinary.js";
import fs from "fs";
import { extractText } from "../ai/extractText.js";
import { chunkText } from "../utils/chunkText.js";
import { generateEmbeddings } from "./embedding.service.js";
import { upsertDocumentEmbeddings, } from "./pinecone.service.js";

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

  let cloudinaryResponse = null;

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

    const document = await Document.create({
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
  CLEANUP CLOUDINARY FILE
  ========================================
  */

    if (
      cloudinaryResponse?.public_id
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

export { uploadDocument };