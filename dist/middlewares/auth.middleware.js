"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireShopAccess = exports.requireOnboarding = exports.requireStaff = exports.requireOwner = exports.requireAuth = void 0;
const better_auth_1 = require("../config/better-auth");
const node_1 = require("better-auth/integrations/node");
const AppError_1 = require("../utils/AppError");
const Shop_1 = require("../models/Shop");
const requireAuth = async (req, _res, next) => {
    try {
        const session = await better_auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return next(new AppError_1.AppError("Unauthorized", 401));
        }
        req.user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role || "staff",
            shopId: session.user.shopId || null,
        };
        next();
    }
    catch {
        next(new AppError_1.AppError("Unauthorized", 401));
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