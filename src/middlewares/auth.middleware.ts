// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const userId = req.headers["x-user-id"] as string;
  const userEmail = req.headers["x-user-email"] as string;

  if (!userId) {
    return next(new AppError("Unauthorized access", HTTP_STATUS.UNAUTHORIZED));
  }

  req.user = {
    id: userId,
    email: userEmail || "",
  };

  next();
};

export const requireShop = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const shopId = req.headers["x-shop-id"] as string;

  if (!shopId) {
    return next(new AppError("Shop ID is required", HTTP_STATUS.BAD_REQUEST));
  }

  req.shopId = shopId;
  next();
};
