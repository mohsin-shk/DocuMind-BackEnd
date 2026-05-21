import { cleanEnv, str, port } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({
    default: 8000,
  }),
  CORS_ORIGIN: str(),
  MONGODB_URI: str(),
  NODE_ENV: str({
   default:"development"
  }),
  ACCESS_TOKEN_SECRET: str(),
  ACCESS_TOKEN_EXPIRY: str(),
  REFRESH_TOKEN_SECRET: str(),
  REFRESH_TOKEN_EXPIRY: str(),
  CLOUDINARY_CLOUD_NAME:str(),
  CLOUDINARY_API_KEY:str(),
  CLOUDINARY_API_SECRET:str(),
});