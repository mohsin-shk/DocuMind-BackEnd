import fs from "fs/promises";
import { ApiError } from "../../utils/ApiError.js";

/*
========================================
TXT TEXT EXTRACTOR
========================================
*/

const extractTextFromTXT = async (filePath)=>{
  try {
    /*
    ========================================
    READ TXT FILE
    ========================================
    */

    const rawText = await fs.readFile(
        filePath,
        "utf-8"
    );

    /*
    ========================================
    NORMALIZE TEXT
    ========================================
    */

    const extractedText = rawText?.replace(/\s+/g, " ")?.trim();

    /*
    ========================================
    VALIDATE EXTRACTION
    ========================================
    */

    if (!extractedText) {
      throw new ApiError(
        400,
        "No extractable text found in TXT file"
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
      `Failed to extract text from TXT file  ${error.message}`
    );
  }
};

export { extractTextFromTXT };