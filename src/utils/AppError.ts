// src/utils/AppError.ts
export class AppError extends Error {
  public readonly statusCode: any;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
