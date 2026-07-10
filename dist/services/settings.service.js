"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const mongoose_1 = require("mongoose");
const Settings_1 = require("../models/Settings");
const Shop_1 = require("../models/Shop");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
// ─── Get Profile ───────────────────────────────────────────────────
const getProfile = async (shopId) => {
    const settings = await Settings_1.Settings.findOne({
        shopId: new mongoose_1.Types.ObjectId(shopId),
    });
    if (!settings) {
        return createDefaultSettings(shopId);
    }
    return settings;
};
exports.getProfile = getProfile;
// ─── Update Profile ────────────────────────────────────────────────
const updateProfile = async (shopId, data) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const updateFields = {};
    if (data.businessName !== undefined)
        updateFields.businessName = data.businessName;
    if (data.logo !== undefined)
        updateFields.logo = data.logo;
    if (data.phone !== undefined)
        updateFields.phone = data.phone;
    if (data.email !== undefined)
        updateFields.email = data.email;
    if (data.address !== undefined)
        updateFields.address = data.address;
    if (data.currency !== undefined)
        updateFields.currency = data.currency.toUpperCase();
    if (data.timezone !== undefined)
        updateFields.timezone = data.timezone;
    if (data.taxPercentage !== undefined)
        updateFields.taxPercentage = data.taxPercentage;
    if (data.invoicePrefix !== undefined)
        updateFields.invoicePrefix = data.invoicePrefix;
    if (data.lowStockThreshold !== undefined)
        updateFields.lowStockThreshold = data.lowStockThreshold;
    if (data.businessType !== undefined)
        updateFields.businessType = data.businessType;
    let settings = await Settings_1.Settings.findOne({ shopId: shopObjectId });
    if (!settings) {
        settings = await Settings_1.Settings.create({
            shopId: shopObjectId,
            ...updateFields,
        });
    }
    else {
        settings = await Settings_1.Settings.findOneAndUpdate({ shopId: shopObjectId }, { $set: updateFields }, { new: true, runValidators: true });
    }
    if (!settings) {
        throw new AppError_1.AppError("Failed to update settings", index_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    // Sync key fields back to Shop model
    const shopUpdates = {};
    if (data.businessName !== undefined)
        shopUpdates.name = data.businessName;
    if (data.logo !== undefined)
        shopUpdates.logo = data.logo;
    if (data.phone !== undefined)
        shopUpdates.phone = data.phone;
    if (data.email !== undefined)
        shopUpdates.email = data.email;
    if (data.address !== undefined)
        shopUpdates.address = data.address;
    if (data.currency !== undefined)
        shopUpdates.currency = data.currency.toUpperCase();
    if (data.timezone !== undefined)
        shopUpdates.timezone = data.timezone;
    if (data.businessType !== undefined)
        shopUpdates.businessType = data.businessType;
    if (Object.keys(shopUpdates).length > 0) {
        await Shop_1.Shop.findOneAndUpdate({ _id: shopObjectId, isDeleted: false }, { $set: shopUpdates });
    }
    return settings;
};
exports.updateProfile = updateProfile;
// ─── Helpers ───────────────────────────────────────────────────────
const createDefaultSettings = async (shopId) => {
    const shop = await Shop_1.Shop.findOne({
        _id: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    });
    return Settings_1.Settings.create({
        shopId: new mongoose_1.Types.ObjectId(shopId),
        businessName: shop?.name || "",
        logo: shop?.logo || "",
        phone: shop?.phone || "",
        email: shop?.email || "",
        address: shop?.address || "",
        currency: shop?.currency || "USD",
        timezone: shop?.timezone || "UTC",
        businessType: shop?.businessType || "",
        taxPercentage: 0,
        invoicePrefix: "INV-",
        lowStockThreshold: 10,
    });
};
//# sourceMappingURL=settings.service.js.map