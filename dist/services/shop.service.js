"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShop = exports.updateShop = exports.getShopById = exports.getShopsByOwner = exports.createShop = void 0;
const Shop_1 = require("../models/Shop");
const AppError_1 = require("../utils/AppError");
const createShop = async (ownerId, shopData) => {
    const existingSlug = await Shop_1.Shop.findOne({
        ownerId,
        slug: shopData.slug,
        isDeleted: false,
    });
    if (existingSlug) {
        throw new AppError_1.AppError("A shop with this slug already exists", 400);
    }
    return await Shop_1.Shop.create({ ...shopData, ownerId });
};
exports.createShop = createShop;
const getShopsByOwner = async (ownerId, options) => {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;
    const filter = { ownerId, isDeleted: false };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { businessType: { $regex: search, $options: "i" } },
        ];
    }
    const [shops, total] = await Promise.all([
        Shop_1.Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Shop_1.Shop.countDocuments(filter),
    ]);
    return {
        shops,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getShopsByOwner = getShopsByOwner;
const getShopById = async (ownerId, shopId) => {
    const shop = await Shop_1.Shop.findOne({
        _id: shopId,
        ownerId,
        isDeleted: false,
    });
    if (!shop) {
        throw new AppError_1.AppError("Shop not found", 404);
    }
    return shop;
};
exports.getShopById = getShopById;
const updateShop = async (ownerId, shopId, updateData) => {
    const existing = await Shop_1.Shop.findOne({
        _id: shopId,
        ownerId,
        isDeleted: false,
    });
    if (!existing) {
        throw new AppError_1.AppError("Shop not found", 404);
    }
    if (updateData.slug && updateData.slug !== existing.slug) {
        const slugTaken = await Shop_1.Shop.findOne({
            ownerId,
            slug: updateData.slug,
            _id: { $ne: shopId },
            isDeleted: false,
        });
        if (slugTaken) {
            throw new AppError_1.AppError("A shop with this slug already exists", 400);
        }
    }
    const shop = await Shop_1.Shop.findOneAndUpdate({ _id: shopId, ownerId, isDeleted: false }, { $set: updateData }, { new: true, runValidators: true });
    if (!shop) {
        throw new AppError_1.AppError("Shop not found", 404);
    }
    return shop;
};
exports.updateShop = updateShop;
const deleteShop = async (ownerId, shopId) => {
    const shop = await Shop_1.Shop.findOneAndUpdate({ _id: shopId, ownerId, isDeleted: false }, { $set: { isDeleted: true, isActive: false } }, { new: true });
    if (!shop) {
        throw new AppError_1.AppError("Shop not found", 404);
    }
};
exports.deleteShop = deleteShop;
//# sourceMappingURL=shop.service.js.map