"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireShopAccess = exports.requireOnboarding = exports.requireStaff = exports.requireOwner = exports.requireAuth = void 0;
const better_auth_1 = require("../config/better-auth");
const AppError_1 = require("../utils/AppError");
const Shop_1 = require("../models/Shop");
const requireAuth = async (req, _res, next) => {
    try {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
            return next(new AppError_1.AppError("No session cookie provided", 401));
        }
        const result = await (0, better_auth_1.verifySession)(cookieHeader);
        if (!result) {
            return next(new AppError_1.AppError("Invalid or expired session", 401));
        }
        req.user = {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role || "staff",
            shopId: result.user.shopId || null,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
const requireOwner = (req, _res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError("Unauthorized", 401));
    }
    if (req.user.role !== "owner") {
        return next(new AppError_1.AppError("Owner access required", 403));
    }
    next();
};
exports.requireOwner = requireOwner;
const requireStaff = (req, _res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError("Unauthorized", 401));
    }
    if (req.user.role !== "owner" && req.user.role !== "staff") {
        return next(new AppError_1.AppError("Staff access required", 403));
    }
    next();
};
exports.requireStaff = requireStaff;
const requireOnboarding = (req, _res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError("Unauthorized", 401));
    }
    if (req.user.shopId) {
        return next(new AppError_1.AppError("User already has a shop", 400));
    }
    next();
};
exports.requireOnboarding = requireOnboarding;
const requireShopAccess = async (req, _res, next) => {
    try {
        if (!req.user) {
            return next(new AppError_1.AppError("Unauthorized", 401));
        }
        if (!req.user.shopId) {
            return next(new AppError_1.AppError("No shop assigned to this account", 403));
        }
        const shop = await Shop_1.Shop.findOne({
            _id: req.user.shopId,
            isDeleted: false,
        });
        if (!shop) {
            return next(new AppError_1.AppError("Shop not found or inactive", 404));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireShopAccess = requireShopAccess;
//# sourceMappingURL=auth.middleware.js.map