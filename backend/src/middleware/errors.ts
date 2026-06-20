import { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request data", details?: unknown) {
    super(message, 422, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Catches synchronous and rejected-promise errors thrown by route handlers.
 * Operational errors (AppError subclasses) are reported with their intended
 * status code and message. Anything unexpected is logged server-side and
 * reduced to a generic 500 so internals never leak to clients.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  res.status(500).json({
    error: {
      message: "An unexpected error occurred. Please try again.",
      ...(env.isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) })
    }
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found` } });
}
