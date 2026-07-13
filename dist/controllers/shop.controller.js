"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShopHandler = exports.updateShopHandler = exports.listShopsHandler = exports.getShopHandler = exports.createFirstShopHandler = exports.createShopHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const shop_service_1 = require("../services/shop.service");
exports.createShopHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ownerId = req.user.id;
    const { name, slug, businessType, phone, email, address, logo, currency, timezone } = req.body;
    const shop = await (0, shop_service_1.createShop)(ownerId, {
        name,
        slug,
        businessType,
        phone,
        email,
        address,
        logo,
        currency,
        timezone,
    });
    (0, response_1.sendResponse)(res, 201, "Shop created successfully", shop);
});
exports.createFirstShopHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { name, slug, businessType, phone, email, address, logo, currency, timezone } = req.body;
    try {
        const shop = await (0, shop_service_1.createFirstShop)(userId, {
            name,
            slug,
            businessType,
            phone,
            email,
            address,
            logo,
            currency,
            timezone,
        });
        (0, response_1.sendResponse)(res, 201, "Shop created successfully", shop);
    }
    catch (error) {
        if (error?.code === 11000) {
            (0, response_1.sendResponse)(res, 400, "A shop with this slug already exists. Please choose a different one.");
            return;
        }
        throw error;
    }
});
exports.getShopHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ownerId = req.user.id;
    const shopId = req.params.id;
    const shop = await (0, shop_service_1.getShopById)(ownerId, shopId);
    (0, response_1.sendResponse)(res, 200, "Shop fetched successfully", shop);
});
exports.listShopsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ownerId = req.user.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const result = await (0, shop_service_1.getShopsByOwner)(ownerId, { page, limit, search });
    (0, response_1.sendResponse)(res, 200, "Shops fetched successfully", result);
});
exports.updateShopHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ownerId = req.user.id;
    const shopId = req.params.id;
    const { name, businessType, phone, email, address, logo, currency, timezone } = req.body;
    const shop = await (0, shop_service_1.updateShop)(ownerId, shopId, {
        name,
        businessType,
        phone,
        email,
        address,
        logo,
        currency,
        timezone,
    });
    (0, response_1.sendResponse)(res, 200, "Shop updated successfully", shop);
});
exports.deleteShopHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ownerId = req.user.id;
    const shopId = req.params.id;
    await (0, shop_service_1.deleteShop)(ownerId, shopId);
    (0, response_1.sendResponse)(res, 200, "Shop deleted successfully");
});
//# sourceMappingURL=shop.controller.js.map