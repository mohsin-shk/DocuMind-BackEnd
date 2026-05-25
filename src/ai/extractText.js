import path from "path";
import { ApiError } from "../utils/ApiError.js";
import {extractTextFromPDF,} from "./extractors/pdf.extractor.js";
import {extractTextFromDOCX,} from "./extractors/docx.extractor.js";
import {extractTextFromTXT,} from "./extractors/txt.extractor.js";

/*
========================================
EXTRACT TEXT ORCHESTRATOR
========================================
*/

const EXTRACTOR_MAP = {
  "application/pdf": extractTextFromPDF,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": extractTextFromDOCX,
  "text/plain": extractTextFromTXT,
};

const EXT_TO_MIME = {
  ".pdf":  "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt":  "text/plain",
};

const extractText = async ({
  mimeType,
  filePath,
}) => {
  /*
  ========================================
  VALIDATE INPUTS
  ========================================
  */


  if (!filePath) throw new ApiError(400, "File path is required");
  if (!mimeType) throw new ApiError(400, "MIME type is required");

  let resolvedMime = mimeType;

  if (resolvedMime === "application/octet-stream") {
    const ext = path.extname(filePath).toLowerCase();
    resolvedMime = EXT_TO_MIME[ext];
  }

  const extractor = EXTRACTOR_MAP[resolvedMime];

  if (!extractor) {
    throw new ApiError(
      415,
      `Unsupported file type: "${resolvedMime}". Supported: PDF, DOCX, TXT`
    );
  }

  const result = await extractor(filePath);

  return {
    ...result,
    mimeType: resolvedMime, // useful downstream for chunking strategy, logging, etc.
  };

};

export { extractText };