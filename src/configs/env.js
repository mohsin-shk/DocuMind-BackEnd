import { cleanEnv, str, port } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({
    default: 8000,
  }),
  CORS_ORIGIN: str(),
  MONGODB_URI: str()
});