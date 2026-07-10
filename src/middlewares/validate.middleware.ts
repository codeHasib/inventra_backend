// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

export const validateRequest = (schema: ZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((e: any) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        return next(new AppError(message, HTTP_STATUS.BAD_REQUEST));
      }
      next(error);
    }
  };
};
