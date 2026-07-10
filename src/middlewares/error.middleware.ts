// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};
