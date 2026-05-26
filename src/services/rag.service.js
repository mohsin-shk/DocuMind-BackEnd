import { env } from "../configs/env.js";
import { ApiError } from "../utils/ApiError.js";
import { generateEmbedding } from "./embedding.service.js";
import { queryDocumentEmbeddings } from "./pinecone.service.js";
import { openai } from "./openai.service.js";

/*
========================================
BUILD RAG CONTEXT
========================================
*/

const buildContext = (matches, minScore = 0.5) => {
  return matches
    .filter((match) => match.score >= minScore)
    .map((match, index) => {
      return `
[Source ${index + 1}]
Document: ${match.metadata.title}

Content:
${match.metadata.text}
`;
    })
    .join("\n\n");
};

/*
========================================
EXTRACT SOURCES
========================================
*/

const extractSources = (matches) => {
  const uniqueSources = new Map();

  matches.forEach((match) => {
    const documentId =
      match.metadata.documentId;

    if (
      !uniqueSources.has(documentId)
    ) {
      uniqueSources.set(
        documentId,
        {
          documentId,

          title:
            match.metadata.title,
        }
      );
    }
  });

  return Array.from(
    uniqueSources.values()
  );
};

/*
========================================
ASK QUESTION USING RAG
========================================
*/

const askQuestion = async ({
  ownerId,
  question,
  documentId = null,
}) => {
  /*
  ========================================
  VALIDATE INPUT
  ========================================
  */

  if (!ownerId || !question?.trim()) {
    throw new ApiError(
      400,
      "Owner ID and question are required"
    );
  }

  try {
    /*
    ========================================
    GENERATE QUERY EMBEDDING
    ========================================
    */

    const queryEmbedding =
      await generateEmbedding(
        question
      );

    /*
    ========================================
    RETRIEVE RELEVANT CHUNKS
    ========================================
    */

    const matches =
      await queryDocumentEmbeddings({
        ownerId,
        queryEmbedding,
        topK: 5,
        documentId,
      });

    /*
    ========================================
    HANDLE EMPTY RETRIEVAL
    ========================================
    */

    if (!matches.length) {
      return {
        answer:
          "I couldn't find relevant information in your uploaded documents.",

        sources: [],
      };
    }

    /*
    ========================================
    BUILD CONTEXT
    ========================================
    */

    const context =
      buildContext(matches);

    if (!context.trim()) {
      return {
        answer: "I couldn't find relevant information in your uploaded documents.",
        sources: [],
      };
    }

    /*
    ========================================
    GENERATE AI RESPONSE
    ========================================
    */

    const completion =
      await openai.chat.completions.create(
        {
          model: env.OPENAI_CHAT_MODEL,
          temperature: 0.2,
          max_tokens: 1000,
          messages: [
            {
              role: "system",

              content: `
You are DocuMind AI.

Answer the user's question ONLY using the provided document context.

If the answer cannot be found in the context, say:
"I could not find this information in the uploaded documents."

Do not hallucinate.
Do not invent facts.
Be concise but helpful.
`,
            },

            {
              role: "user",

              content: `
DOCUMENT CONTEXT:

${context}

-----------------------------------

QUESTION:
${question}
`,
            },
          ],
        }
      );

    /*
    ========================================
    EXTRACT ANSWER
    ========================================
    */

    // const answer =
    //   completion.choices?.[0]
    //     ?.message?.content;
    const choice = completion.choices?.[0];
    const answer = choice?.message?.content;
    const finishReason = choice?.finish_reason;

    if (!answer) {
      throw new ApiError(
        500,
        "Failed to generate AI response"
      );
    }

    if (finishReason === "length") {
      console.warn("RAG response was truncated — consider increasing max_tokens");
    }

    /*
    ========================================
    EXTRACT SOURCES
    ========================================
    */

    const sources =
      extractSources(matches);

    /*
    ========================================
    RETURN RESPONSE
    ========================================
    */

    return {
      answer,

      sources,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error.message ||
      "Failed to process RAG request"
    );
  }
};

export { askQuestion };