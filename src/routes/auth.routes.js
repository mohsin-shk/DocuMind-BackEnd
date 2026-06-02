import { Router } from "express";
import {
  registerUserController,
  loginUserController,
  refreshAccessTokenController,
  logoutUserController,
  getCurrentUserController,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";
import {
    registerLimiter,
    loginLimiter,
    refreshTokenLimiter,
    logoutLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

/*
========================================
PUBLIC ROUTES
========================================
*/

router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  registerUserController
);

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  loginUserController
);

router.post(
  "/refresh-token",
  refreshTokenLimiter,
  refreshAccessTokenController
);

/*
========================================
PROTECTED ROUTES
========================================
*/

router.post(
  "/logout",
  logoutLimiter,
  requireAuth,
  logoutUserController
);

router.get(
  "/me",
  requireAuth,
  getCurrentUserController
);

export default router;