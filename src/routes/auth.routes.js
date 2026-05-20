import { Router } from "express";
import {
  registerUserController,
  loginUserController,
  refreshAccessTokenController,
  logoutUserController,
  getCurrentUserController,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

/*
========================================
PUBLIC ROUTES
========================================
*/

router.post(
  "/register",
  registerUserController
);

router.post(
  "/login",
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