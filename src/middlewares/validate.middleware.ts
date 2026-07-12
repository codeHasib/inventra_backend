import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export const validateRequest = (schema: ZodObject) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
        logger.error(`Validation failed: ${JSON.stringify(issues)}`);
        const message = issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        return next(new AppError(message, 400));
      }
      next(error);
    }
  };
};
