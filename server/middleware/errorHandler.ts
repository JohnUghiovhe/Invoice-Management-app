import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError("Route not found", 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  // Surface unexpected runtime failures in the dev terminal so we can diagnose them quickly.
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    if (message.includes("database_url is required") || message.includes("enotfound") || message.includes("econnrefused") || message.includes("timed out")) {
      res.status(503).json({ message: err.message });
      return;
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: "Unexpected server error" });
}
