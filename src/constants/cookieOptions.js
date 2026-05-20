import { env } from "../configs/env.js";

/*
========================================
ACCESS TOKEN COOKIE OPTIONS
========================================
*/

const accessTokenCookieOptions = Object.freeze({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000, // 15 minutes
});

/*
========================================
REFRESH TOKEN COOKIE OPTIONS
========================================
*/

const refreshTokenCookieOptions =
  Object.freeze({
    httpOnly: true,
    secure:env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:10 * 24 * 60 * 60 * 1000, // 10 days
});

export {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
};