import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "../configs/env.js";
import { ApiError } from "../utils/ApiError.js";

/*
========================================
INITIALIZE PINECONE CLIENT
========================================
*/

const pinecone = new Pinecone({
    apiKey: env.PINECONE_API_KEY,
});

/*
========================================
INITIALIZE INDEX
========================================
*/

const pineconeIndex = pinecone.index(env.PINECONE_INDEX_NAME);

/*
========================================
GENERATE USER NAMESPACE
========================================
*/

const generateNamespace = (ownerId) => {
    return `user-${ownerId}`;
};

/*
========================================
UPSERT DOCUMENT EMBEDDINGS
========================================
*/

const upsertDocumentEmbeddings = async ({ ownerId, documentId, title, embeddedChunks, }) => {
    /*
     ========================================
     VALIDATE INPUT
     ========================================
    */

    if (
        !ownerId ||
        !documentId ||
        !Array.isArray(
            embeddedChunks
        ) ||
        !embeddedChunks.length
    ) {
        throw new ApiError(
            400,
            "Invalid embedding payload"
        );
    }

    try {
        /*
        ========================================
        GENERATE NAMESPACE
        ========================================
        */
        const namespace = generateNamespace(ownerId);

        /*
        ========================================
        FORMAT VECTORS
        ========================================
        */
        const vectors =
            embeddedChunks.map(
                (chunk) => ({
                    id: `${documentId}_${chunk.chunkIndex}`,

                    values: Array.from(chunk.embedding),

                    metadata: {
                        documentId:
                            documentId.toString(),

                        ownerId:
                            ownerId.toString(),

                        chunkIndex:
                            chunk.chunkIndex,

                        title,

                        text: chunk.text,
                    },
                })
            );

        /*
        ========================================
        UPSERT VECTORS
        ========================================
        */

        await pineconeIndex
            .namespace(namespace)
            .upsert({ records: vectors });



        /*
        ========================================
        RETURN NAMESPACE
        ========================================
        */

        return {
            namespace,
            vectorCount: vectors.length,
        };


    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            500,
            error.message || "Failed to store document embeddings"
        );
    }
}

/*
========================================
QUERY DOCUMENT EMBEDDINGS
========================================
*/

const queryDocumentEmbeddings = async ({ ownerId, queryEmbedding, topK = 5, documentId = null, }) => {
    /*
    ========================================
    VALIDATE INPUT
    ========================================
    */

    if (
        !ownerId ||
        !queryEmbedding
    ) {
        throw new ApiError(
            400,
            "Invalid vector query payload"
        );
    }

    try {
        /*
        ========================================
        GENERATE NAMESPACE
        ========================================
        */

        const namespace = generateNamespace(ownerId);

        /*
        ========================================
        QUERY VECTORS
        ========================================
        */
        const response =
            await pineconeIndex
                .namespace(namespace)
                .query({
                    vector: queryEmbedding,
                    topK,
                    includeMetadata: true,
                    ...(documentId && {
                        filter: { documentId: { $eq: documentId.toString() } }
                    }),
                });

        /*
        ========================================
        RETURN MATCHES
        ========================================
        */
        return response.matches || [];

    } catch (error) {
        throw new ApiError(
            500,
            "Failed to query document embeddings"
        );
    }
}

/*
========================================
DELETE DOCUMENT EMBEDDINGS
========================================
*/


const deleteDocumentEmbeddings = async ({ ownerId, documentId, chunkCount, }) => {
    /*
    ========================================
    VALIDATE INPUT
    ========================================
    */

    if (
        !ownerId ||
        !documentId ||
        !chunkCount
    ) {
        throw new ApiError(
            400,
            "Invalid vector deletion payload"
        );
    }
    try {
        /*
        ========================================
        GENERATE NAMESPACE
        ========================================
        */

        const namespace = generateNamespace(ownerId);

        /*
        ========================================
        GENERATE VECTOR IDS
        ========================================
        */

        const vectorIds =
            Array.from(
                { length: chunkCount },
                (_, index) =>
                    `${documentId}_${index}`
            );

        /*
        ========================================
        DELETE VECTORS
        ========================================
        */

        await pineconeIndex
            .namespace(namespace)
            .deleteMany({ ids: vectorIds });

        return true;

    } catch (error) {
        throw new ApiError(
            500,
            "Failed to delete document embeddings"
        );
    }
}

export { upsertDocumentEmbeddings, queryDocumentEmbeddings, deleteDocumentEmbeddings, };