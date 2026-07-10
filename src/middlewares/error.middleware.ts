import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    logger.error(`Unhandled error: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    data: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};
