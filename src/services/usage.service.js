import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../configs/env.js";

/*
========================================
RESET USAGE IF NEEDED (DAILY RESET)
========================================
*/

const resetUsageIfNeeded = async (ownerId) => {
  const user = await User.findById(ownerId).select("aiUsage");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const now = new Date();
  const lastReset = new Date(user.aiUsage.lastUsageReset);
  const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    await User.findByIdAndUpdate(ownerId, {
      $set: {
        "aiUsage.questionsAsked": 0,
        "aiUsage.tokensUsed": 0,
        "aiUsage.lastUsageReset": now,
      },
    });
  }
};

/*
========================================
CHECK AND INCREMENT DOCUMENT USAGE
(ATOMIC — no race condition)
Note: document limit is lifetime, not
daily — tied to storage not usage quota
========================================
*/


const checkAndIncrementDocumentUsage = async (ownerId) => {
  const user = await User.findOneAndUpdate(
    {
      _id: ownerId,
      "aiUsage.documentsUploaded": {
        $lt: env.MAX_DOCUMENTS_PER_USER,
      },
    },
    {
      $inc: {
        "aiUsage.documentsUploaded": 1,
      },
    },
    { new: true }
  );

  if (!user) {
    const exists = await User.exists({ _id: ownerId });

    if (!exists) {
      throw new ApiError(404, "User not found");
    }

    throw new ApiError(
      403,
      `Document upload limit reached. Maximum allowed: ${env.MAX_DOCUMENTS_PER_USER}`
    );
  }

  return true;
};

/*
========================================
DECREMENT DOCUMENT USAGE
called on upload failure to roll back
========================================
*/

const decrementDocumentUsage = async (ownerId) => {
  await User.findByIdAndUpdate(
    ownerId,
    {
      $inc: {
        "aiUsage.documentsUploaded": -1,
      },
    }
  );
};

/*
========================================
CHECK AND INCREMENT QUESTION USAGE
(ATOMIC — no race condition)
Resets daily via resetUsageIfNeeded
========================================
*/

const checkAndIncrementQuestionUsage = async (ownerId) => {
  const user = await User.findOneAndUpdate(
    {
      _id: ownerId,
      "aiUsage.questionsAsked": {
        $lt: env.MAX_QUESTIONS_PER_USER,
      },
    },
    {
      $inc: {
        "aiUsage.questionsAsked": 1,
      },
    },
    { new: true }
  );

  if (!user) {
    const exists = await User.exists({ _id: ownerId });

    if (!exists) {
      throw new ApiError(404, "User not found");
    }

    throw new ApiError(
      403,
      `Daily question limit reached. Maximum allowed: ${env.MAX_QUESTIONS_PER_USER} questions per day`
    );
  }

  return true;
};

/*
========================================
CHECK TOKEN LIMIT
called before RAG to block users already
over their daily token limit
========================================
*/

const checkTokenLimit = async (ownerId) => {
  const user = await User.findById(ownerId).select("aiUsage");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.aiUsage.tokensUsed >= env.MAX_TOKENS_PER_USER) {
    throw new ApiError(
      403,
      `Daily token limit reached. Maximum allowed: ${env.MAX_TOKENS_PER_USER} tokens per day`
    );
  }

  return true;
};

/*
========================================
INCREMENT TOKEN USAGE
called after RAG completes with actual
token count from OpenAI response
========================================
*/

const incrementTokenUsage = async (ownerId, tokens) => {
  if (!Number.isFinite(tokens) || tokens <= 0) {
    console.warn(
      `incrementTokenUsage: invalid token value "${tokens}" for user ${ownerId} — skipping`
    );
    return;
  }

  await User.findByIdAndUpdate(
    ownerId,
    {
      $inc: {
        "aiUsage.tokensUsed": tokens,
      },
    }
  );
};



/*
========================================
GET USER USAGE
returned to client so frontend can
display usage stats / limits
========================================
*/

const getUserUsage = async (ownerId) => {
  const user = await User.findById(ownerId).select("aiUsage");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    documentsUploaded: user.aiUsage.documentsUploaded,
    documentsLimit: env.MAX_DOCUMENTS_PER_USER,
    documentsRemaining: Math.max(
      0,
      env.MAX_DOCUMENTS_PER_USER - user.aiUsage.documentsUploaded
    ),

    questionsAsked: user.aiUsage.questionsAsked,
    questionsLimit: env.MAX_QUESTIONS_PER_USER,
    questionsRemaining: Math.max(
      0,
      env.MAX_QUESTIONS_PER_USER - user.aiUsage.questionsAsked
    ),

    tokensUsed: user.aiUsage.tokensUsed,
    tokensLimit: env.MAX_TOKENS_PER_USER,
    tokensRemaining: Math.max(
      0,
      env.MAX_TOKENS_PER_USER - user.aiUsage.tokensUsed
    ),

    lastUsageReset: user.aiUsage.lastUsageReset,
    nextResetAt: new Date(
      new Date(user.aiUsage.lastUsageReset).getTime() +
      24 * 60 * 60 * 1000
    ),
  };
};


export {
  resetUsageIfNeeded,
  checkAndIncrementDocumentUsage,
  decrementDocumentUsage,
  checkAndIncrementQuestionUsage,
  checkTokenLimit,
  incrementTokenUsage,
  getUserUsage,
};