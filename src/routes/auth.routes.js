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

const router = Router();

/*
========================================
PUBLIC ROUTES
========================================
*/

router.post(
  "/register",
  validate(registerSchema),
  registerUserController
);

router.post(
  "/login",
  validate(loginSchema),
  loginUserController
);

router.post(
  "/refresh-token",
  refreshAccessTokenController
);

/*
========================================
PROTECTED ROUTES
========================================
*/

router.post(
  "/logout",
  requireAuth,
  logoutUserController
);

router.get(
  "/me",
  requireAuth,
  getCurrentUserController
);

export default router;