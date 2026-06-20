import { Router } from "express";
import { authLimiter } from "@/middleware/rateLimiters";
import { validate } from "@/middleware/validate";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), authController.register);
authRouter.post("/login", authLimiter, validate(loginSchema), authController.login);
