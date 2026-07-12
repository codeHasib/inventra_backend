import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/better-auth";
import { AppError } from "../utils/AppError";
import { Shop } from "../models/Shop";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fromNodeHeaders } = await import("better-auth/node");
    const auth = await getAuth();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return next(new AppError("Unauthorized", 401));
    }

    const user = session.user as Record<string, unknown>;

    req.user = {
      id: user.id as string,
      email: user.email as string,
      role: (user.role as string) || "staff",
      shopId: (user.shopId as string) || null,
    };

    next();
  } catch {
    next(new AppError("Unauthorized", 401));
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

export const requireOnboarding = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  if (req.user.shopId) {
    return next(new AppError("User already has a shop", 400));
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
