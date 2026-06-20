import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

/** Applied to all /api routes - generous, but stops basic abuse/scraping. */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests, please slow down and try again shortly." } }
});

/**
 * Applied only to login/register. Much tighter window protects against
 * credential stuffing and brute-force password guessing.
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many authentication attempts. Please try again later." } }
});
