import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { UnauthorizedError } from "./errors";

interface AccessTokenPayload {
  sub: number;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

/**
 * Verifies the bearer token on protected routes and attaches a minimal
 * `req.user` for downstream handlers. Rejects missing/expired/tampered
 * tokens uniformly with a 401 so no information about *why* it failed is
 * exposed to the caller.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & jwt.JwtPayload;
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired session, please log in again"));
  }
}
