import mammoth from "mammoth";
import { ApiError } from "../../utils/ApiError.js";

/*
========================================
DOCX TEXT EXTRACTOR
========================================
*/

const extractTextFromDOCX = async (filePath) => {
  try {
    /*
    ========================================
    EXTRACT RAW TEXT
    ========================================
    */
    const result = await mammoth.extractRawText({
        path: filePath,
    });

    /*
    ========================================
    NORMALIZE TEXT
    ========================================
    */

    const extractedText = result.value?.replace(/\s+/g, " ")?.trim();

    /*
    ========================================
    VALIDATE EXTRACTION
    ========================================
    */

    if (!extractedText) {
      throw new ApiError(
        400,
        "No extractable text found in DOCX"
      );
    }

    /*
    ========================================
    RETURN RESULT
    ========================================
    */

    return {
      text: extractedText,
      metadata: {},
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      500,
      "Failed to extract text from DOCX"
    );
  }
};

export { extractTextFromDOCX };