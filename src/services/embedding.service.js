import { openai } from "./openai.service.js";
import { env } from "../configs/env.js";
import { ApiError } from "../utils/ApiError.js";
/*
========================================
GENERATE SINGLE EMBEDDING
========================================
*/

const generateEmbedding = async (
    text
) => {
    /*
 ========================================
 VALIDATE INPUT
 ========================================
 */

    if (!text?.trim()) {
        throw new ApiError(
            400,
            "Text is required for embedding generation"
        );
    }

    try {
        /*
       ========================================
       GENERATE EMBEDDING
       ========================================
       */

        const response =
            await openai.embeddings.create({
                model: env.OPENAI_EMBEDDING_MODEL,
                input: text.trim(),
            });

        /*
        ========================================
        EXTRACT VECTOR
        ========================================
        */

        const embedding = response.data?.[0]?.embedding;

        if (!embedding) {
            throw new ApiError(
                500,
                "Failed to generate embedding"
            );
        }

        /*
        ========================================
        RETURN VECTOR
        ========================================
        */

        return embedding;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            500,
            error.message || "Embedding generation failed"
        );
    }
}

/*
========================================
GENERATE BATCH EMBEDDINGS
========================================
*/

const generateEmbeddings = async (
    chunks
) => {
    /*
 ========================================
 VALIDATE INPUT
 ========================================
 */

    if (
        !Array.isArray(chunks) ||
        !chunks.length
    ) {
        throw new ApiError(
            400,
            "Chunks are required for embedding generation"
        );
    }

    /*
   ========================================
   PREPARE INPUTS
   ========================================
   */

    const texts = chunks.map((chunk) =>
        chunk.text.trim()
    );

    try {
        /*
        ========================================
        GENERATE EMBEDDINGS
        ========================================
        */

        const response =
            await openai.embeddings.create({
                model:
                    env.OPENAI_EMBEDDING_MODEL,

                input: texts,
            });

        /*
       ========================================
       VALIDATE RESPONSE
       ========================================
       */
        if (
            !response.data ||
            response.data.length !==
            chunks.length
        ) {
            throw new ApiError(
                500,
                "Embedding generation mismatch"
            );
        }

        /*
        ========================================
        MAP EMBEDDINGS TO CHUNKS
        ========================================
        */

        
        const embeddedChunks = chunks.map((chunk, i) => {
            const match = response.data.find((d) => d.index === i);
            const embedding = match?.embedding;

            if (!embedding) {
                throw new ApiError(
                    500,
                    `Missing embedding for chunk at index ${i}`
                );
            }

            return {
                ...chunk,
                embedding,
            };
        });

        /*
        ========================================
        RETURN RESULT
        ========================================
        */
        return embeddedChunks;

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            500,
            error.message || "Batch embedding generation failed"
        );
    }
}

export {
    generateEmbedding,
    generateEmbeddings,
};