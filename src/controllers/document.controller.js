import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadDocument} from "../services/document.service.js";

/*
========================================
UPLOAD DOCUMENT CONTROLLER
========================================
*/

const uploadDocumentController = asyncHandler( async (req,res)=>{
    /*
    ========================================
    VALIDATE FILE
    ========================================
    */

    if (!req.file) {
      throw new ApiError(
        400,
        "Document file is required"
      );
    }

    /*
    ========================================
    EXTRACT REQUEST DATA
    ========================================
    */

    const uploadedFile = req.file;
    const ownerId = req.user._id;
    const { title } = req.body;

    /*
    ========================================
    UPLOAD DOCUMENT
    ========================================
    */

    const document = await uploadDocument({
        uploadedFile,
        ownerId,
        title,
    });

    /*
    ========================================
    RESPONSE
    ========================================
    */

    return res.status(201).json(
      new ApiResponse(
        201,
        document,
        "Document uploaded successfully"
      )
    );

})

export {uploadDocumentController,};