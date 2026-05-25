import fs from "fs";
import { PDFParse } from "pdf-parse";
import { ApiError } from "../../utils/ApiError.js";
import { pathToFileURL } from "url";

/*
========================================
PDF TEXT EXTRACTOR
========================================
*/

const extractTextFromPDF = async (filePath) => {
  try {
    /*
    ======================================== 
    PARSE PDF
    ========================================
    */
    const fileUrl = pathToFileURL(filePath).href;
    const parser = new PDFParse({ url: fileUrl });
    const parsedPdf = await parser.getText();


    /*
    ========================================
    NORMALIZE TEXT
    ========================================
    */

    const extractedText = parsedPdf.text
      ?.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "")  // remove page markers
      ?.replace(/\s+/g, " ")
      ?.trim();

    /*
    ========================================
    VALIDATE EXTRACTION
    ========================================
    */

    if (!extractedText) {
      throw new ApiError(
        400,
        "No extractable text found in PDF"
      );
    }

    /*
    ========================================
    RETURN RESULT
    ========================================
    */

    return {
      text: extractedText,
      metadata: {
        pageCount: parsedPdf.total ?? parsedPdf.pages?.length ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to extract text from PDF: ${error.message}`);
  }
};

export { extractTextFromPDF };