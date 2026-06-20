import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "./errors";

type RequestPart = "body" | "query" | "params";

/**
 * Validates and replaces req[part] with the parsed, type-safe result of
 * `schema`. Centralizing validation here keeps controllers free of manual
 * checks and guarantees malformed input never reaches business logic.
 */
export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new ValidationError("Request validation failed", result.error.flatten().fieldErrors));
      return;
    }
    (req as unknown as Record<RequestPart, unknown>)[part] = result.data;
    next();
  };
}
