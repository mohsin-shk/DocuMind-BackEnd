import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {documentUploadMiddleware,} from "../middlewares/upload.middleware.js";
import {uploadDocumentController,} from "../controllers/document.controller.js";

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

  uploadDocumentController
);

export default router;