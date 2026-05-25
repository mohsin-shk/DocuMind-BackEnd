import OpenAI from "openai";
import { env } from "../configs/env.js";
import { ApiError } from "../utils/ApiError.js";

/*
========================================
VALIDATE OPENAI API KEY
========================================
*/

if (!env.OPENAI_API_KEY) {
  throw new ApiError(
    500,
    "OpenAI API key is missing"
  );
}

/*
========================================
INITIALIZE OPENAI CLIENT
========================================
*/

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export { openai };