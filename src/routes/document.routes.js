import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {documentUploadMiddleware,} from "../middlewares/upload.middleware.js";
import {uploadDocumentController,} from "../controllers/document.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadDocumentSchema } from "../validators/document.validator.js";
const router = Router();

/*
========================================
UPLOAD DOCUMENT
========================================
*/

router.post(
  "/upload",
  requireAuth,
  documentUploadMiddleware.single(
    "document"
  ),
  validate(uploadDocumentSchema, "body"),
  uploadDocumentController
);

export default router;