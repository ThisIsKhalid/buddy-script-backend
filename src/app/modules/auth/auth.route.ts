import express from "express";
import {
  authenticatedPolicy,
  loginPolicy,
  refreshTokenPolicy,
  registerPolicy,
} from "../../../config/rateLimitPolicies";
import auth from "../../middlewares/auth";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { RequestValidation } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/register",
  rateLimiter(registerPolicy),
  RequestValidation.validateRequest(AuthValidation.createUserZodSchema),
  AuthController.register
);

router.post(
  "/login",
  rateLimiter(loginPolicy),
  RequestValidation.validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  rateLimiter(refreshTokenPolicy),
  RequestValidation.validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

router.post("/logout", auth(), AuthController.logout);

router.get("/me", rateLimiter(authenticatedPolicy), auth(), AuthController.getMe);

export const AuthRoutes = router;
