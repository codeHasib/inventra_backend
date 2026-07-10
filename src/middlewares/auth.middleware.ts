import { Request, Response, NextFunction } from "express";
import { verifySession } from "../config/better-auth";
import { AppError } from "../utils/AppError";
import { Shop } from "../models/Shop";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return next(new AppError("No session cookie provided", 401));
    }

    const result = await verifySession(cookieHeader);

    if (!result) {
      return next(new AppError("Invalid or expired session", 401));
    }

    req.user = {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role || "staff",
      shopId: result.user.shopId || null,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireOwner = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  if (req.user.role !== "owner") {
    return next(new AppError("Owner access required", 403));
  }

  next();
};

export const requireStaff = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  if (req.user.role !== "owner" && req.user.role !== "staff") {
    return next(new AppError("Staff access required", 403));
  }

  next();
};

export const requireShopAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!req.user.shopId) {
      return next(new AppError("No shop assigned to this account", 403));
    }

    const shop = await Shop.findOne({
      _id: req.user.shopId,
      isDeleted: false,
    });

    if (!shop) {
      return next(new AppError("Shop not found or inactive", 404));
    }

    next();
  } catch (error) {
    next(error);
  }
};
