import rateLimit from "express-rate-limit";

/*
========================================
RATE LIMIT MESSAGE HELPER
========================================
*/

const rateLimitMessage = (action, windowMinutes) => ({
    success: false,
    message: `Too many ${action} attempts. Please try again after ${windowMinutes} minutes.`,
    errors: [],
});

/*
========================================
AUTH RATE LIMITERS
----------------------------------------
Strictest limits — protects against:
- Brute force login attacks
- Credential stuffing
- Account enumeration
========================================
*/

/*
Register: 5 attempts per hour per IP
Strict because account creation is
expensive (DB write, email send)
*/
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("registration", 60),
    skipSuccessfulRequests: false,
});

/*
Login: 10 attempts per 15 minutes per IP
After 10 failed logins, attacker is
blocked for 15 minutes
*/
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("login", 15),
    skipSuccessfulRequests: true,
    // successful logins don't count against limit
    // only failed attempts matter for brute force
});

/*
Refresh token: 30 per 15 minutes per IP
Higher limit since legitimate apps
silently refresh tokens frequently
*/
const refreshTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("token refresh", 15),
    skipSuccessfulRequests: true,
});

/*
Logout: 10 per 15 minutes
Prevents logout-loop abuse
*/
const logoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("logout", 15),
    skipSuccessfulRequests: true,
});

/*
========================================
DOCUMENT RATE LIMITERS
----------------------------------------
Protects against:
- Storage exhaustion
- Repeated processing abuse
- OpenAI embedding cost abuse
========================================
*/

/*
Upload: 10 uploads per hour per IP
Each upload triggers:
- Cloudinary storage write
- Text extraction
- OpenAI embedding generation
- Pinecone upsert
All expensive operations
*/
const documentUploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("document upload", 60),
    skipSuccessfulRequests: false,
});

/*
========================================
CHAT RATE LIMITERS
----------------------------------------
Protects against:
- OpenAI API cost exhaustion
- Pinecone query abuse
- Message spam
========================================
*/

/*
Create chat: 20 per hour per IP
Prevents chat session spam
*/
const createChatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("chat creation", 60),
    skipSuccessfulRequests: false,
});

/*
Send message: 60 per 15 minutes per IP
Each message triggers:
- OpenAI embedding (query)
- Pinecone semantic search
- OpenAI chat completion
All incur direct API costs
1 message per 15 seconds on average
*/
const sendMessageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("message", 15),
    skipSuccessfulRequests: false,
});

/*
Get messages / chats: 120 per 15 minutes
Read operations, more permissive
but still protected against scraping
*/
const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("read", 15),
    skipSuccessfulRequests: true,
});

/*
Delete: 20 per hour
Prevents bulk deletion attacks
*/
const deleteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("delete", 60),
    skipSuccessfulRequests: false,
});

/*
========================================
GLOBAL FALLBACK LIMITER
----------------------------------------
Applied at app level as last resort.
Very permissive — just blocks extreme
abuse that slips past specific limiters.
========================================
*/

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: rateLimitMessage("request", 15),
    skipSuccessfulRequests: false,
});

export {
    registerLimiter,
    loginLimiter,
    refreshTokenLimiter,
    logoutLimiter,
    documentUploadLimiter,
    createChatLimiter,
    sendMessageLimiter,
    readLimiter,
    deleteLimiter,
    globalLimiter,
};