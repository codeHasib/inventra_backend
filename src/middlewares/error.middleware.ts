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
    logger.error(`${statusCode}: ${message}`);
  } else if (
    (err as any).code === 11000 ||
    (err as any).name === "MongoServerError"
  ) {
    statusCode = 400;
    const duplicateField = Object.keys((err as any).keyPattern || {}).join(", ");
    message = duplicateField
      ? `A product with this ${duplicateField} already exists.`
      : "A product with this SKU, Slug, or Barcode already exists.";
    logger.error(`400 DuplicateKey: ${message}`);
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
