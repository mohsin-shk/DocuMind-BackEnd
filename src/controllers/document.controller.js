import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadDocument,getUserDocuments,getDocument,deleteDocument,} from "../services/document.service.js";
import mongoose from "mongoose";

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

    /*
    ========================================
    UPLOAD DOCUMENT
    ========================================
    */

    const document = await uploadDocument({
        uploadedFile,
        ownerId,
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


/*
========================================
GET USER DOCUMENTS
========================================
*/

const getUserDocumentsController = asyncHandler(async (req, res) => {
    const documents = await getUserDocuments(req.user._id);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                documents,
                count: documents.length,
            },
            "Documents fetched successfully"
        )
    );
});


/*
========================================
GET SINGLE DOCUMENT
========================================
*/

const getDocumentController = asyncHandler(async (req, res) => {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new ApiError(400, "Invalid document ID");
    }

    const document = await getDocument({
        ownerId: req.user._id,
        documentId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            document,
            "Document fetched successfully"
        )
    );
});

/*
========================================
DELETE DOCUMENT
========================================
*/

const deleteDocumentController = asyncHandler(async (req, res) => {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new ApiError(400, "Invalid document ID");
    }

    const deletedDocument = await deleteDocument({
        ownerId: req.user._id,
        documentId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { documentId: deletedDocument._id },
            "Document deleted successfully"
        )
    );
});


export {uploadDocumentController,getUserDocumentsController,getDocumentController,deleteDocumentController,};