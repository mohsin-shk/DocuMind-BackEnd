import path from "path";
import { Document } from "../models/document.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "../configs/cloudinary.js";

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
       RETURN DOCUMENT
       ========================================
       */
        return document;

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

export { uploadDocument };