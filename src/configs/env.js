import { cleanEnv, str, port,num } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({
    default: 8000,
  }),
  CORS_ORIGIN: str(),
  MONGODB_URI: str(),
  NODE_ENV: str({
    default: "development"
  }),
  ACCESS_TOKEN_SECRET: str(),
  ACCESS_TOKEN_EXPIRY: str(),
  REFRESH_TOKEN_SECRET: str(),
  REFRESH_TOKEN_EXPIRY: str(),
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),
  OPENAI_API_KEY: str(),
  OPENAI_EMBEDDING_MODEL: str({
    default: "text-embedding-3-small",
  }),
  OPENAI_CHAT_MODEL: str({
    default: "gpt-4.1-mini",
  }),
  PINECONE_API_KEY: str(),
  PINECONE_INDEX_NAME: str(),
  MAX_DOCUMENTS_PER_USER: num({
    default: 5,
  }),

  MAX_QUESTIONS_PER_USER: num({
    default: 10,
  }),

  MAX_TOKENS_PER_USER: num({
    default: 5000,
  }),
});