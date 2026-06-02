import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { documentUploadMiddleware, } from "../middlewares/upload.middleware.js";
import { uploadDocumentController, getUserDocumentsController, getDocumentController, deleteDocumentController, } from "../controllers/document.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { documentIdParamsSchema, uploadDocumentSchema } from "../validators/document.validator.js";
import {
    documentUploadLimiter,
    readLimiter,
    deleteLimiter,
} from "../middlewares/rateLimit.middleware.js";
const router = Router();

/*
========================================
UPLOAD DOCUMENT
========================================
*/

router.post(
    "/upload",
    documentUploadLimiter,
    requireAuth,
    documentUploadMiddleware.single(
        "document"
    ),
    validate(uploadDocumentSchema, "body"),
    uploadDocumentController
);


router.get(
    "/",
    readLimiter,
    requireAuth,
    getUserDocumentsController
);

router.get(
    "/:documentId",
    readLimiter,
    validate(
        documentIdParamsSchema,
        "params"
    ),
    requireAuth,
    getDocumentController
);

router.delete(
    "/:documentId",
    deleteLimiter,
    validate(
        documentIdParamsSchema,
        "params"
    ),
    requireAuth,
    deleteDocumentController
);


export default router;