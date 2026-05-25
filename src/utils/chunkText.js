import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ApiError } from "./ApiError.js";

/*
========================================
CHUNK TEXT UTILITY
========================================
*/

const SEPARATORS = [
    "\f",       // Form feed — common PDF page boundary artifact
    "\n\n\n",   // Triple newline — major section breaks
    "\n\n",     // Double newline — paragraph breaks
    "\n",       // Single newline
    ". ",       // Sentence boundary (with trailing space to avoid "Dr. Smith" splits)
    "! ",       // Exclamation sentence end
    "? ",       // Question sentence end
    "; ",       // Clause boundary
    ", ",       // Sub-clause boundary
    " ",        // Word boundary
    "",         // Character-level fallback (last resort)
];

const chunkText = async ({
    text,
    chunkSize = 1000,
    chunkOverlap = 200,
    minChunkLength = 50,
}) => {
    /*
   ========================================
   VALIDATE INPUTS
   ========================================
   */
    if (!text?.trim()) {
        throw new ApiError(400, "Text is required for chunking");
    }

    if (chunkOverlap >= chunkSize) {
        throw new ApiError(
            400,
            `chunkOverlap (${chunkOverlap}) must be less than chunkSize (${chunkSize})`
        );
    }

    if (minChunkLength >= chunkSize) {
        throw new ApiError(
            400,
            `minChunkLength (${minChunkLength}) must be less than chunkSize (${chunkSize})`
        );
    }

    /*
    ========================================
    INITIALIZE SPLITTER
    ========================================
    */
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separators: SEPARATORS,
    });

    /*
    ========================================
    SPLIT TEXT
    ========================================
    */
    let rawChunks;

    try {
        rawChunks = await splitter.splitText(text);
    } catch (error) {
        throw new ApiError(500, `Text splitting failed: ${error.message}`);
    }

    /*
    ========================================
    NORMALIZE, FILTER & SHAPE CHUNKS
    ========================================
    */
    const chunks = rawChunks
        .map((chunk) => chunk.replace(/\s+/g, " ").trim()) // normalize whitespace
        .filter((chunk) => chunk.length >= minChunkLength)  // drop noise/stub chunks
        .map((text, index) => ({
            chunkIndex: index,                                // position in sequence
            text,
            length: text.length,                             // useful for debugging & token estimation
        }));

    /*
   ========================================
   VALIDATE OUTPUT
   ========================================
   */
    if (!chunks.length) {
        throw new ApiError(
            500,
            "Chunking produced no usable chunks. The text may be too short or consist only of whitespace/noise."
        );
    }

    /*
    ========================================
    RETURN CHUNKS + METADATA
    ========================================
    */

    return {
        chunks,
        metadata: {
            totalChunks: chunks.length,
            chunkSize,
            chunkOverlap,
            minChunkLength,
            totalCharacters: text.length,
            avgChunkLength: Math.round(
                chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length
            ),
        },
    };

}

export {chunkText};