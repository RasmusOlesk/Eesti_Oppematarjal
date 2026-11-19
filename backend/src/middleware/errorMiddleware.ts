import type { Request, Response, NextFunction } from "express";
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from "sequelize";

export interface AppError extends Error {
  statusCode?: number;
}

// if (404 Not Found)
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// Global error handler (4 args)
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // invalid json (from express.json())
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Invalid JSON payload" });
    return;
  }

  // Not uniq or otrside keys Sequelize
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ message: "Resource already exists (unique constraint violation)" });
    return;
  }

  if (err instanceof ForeignKeyConstraintError) {
    res.status(409).json({ message: "Operation violates foreign key constraint" });
    return;
  }

  // Models validation Sequelize
  if (err instanceof ValidationError) {
    res.status(400).json({
      message: err.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  if (statusCode >= 500) {
    console.error("Unhandled server error:", err);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};