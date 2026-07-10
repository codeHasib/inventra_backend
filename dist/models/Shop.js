"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shop = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const shopSchema = new mongoose_1.Schema({
    ownerId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    businessType: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    logo: { type: String, default: "" },
    currency: { type: String, default: "USD", uppercase: true },
    timezone: { type: String, default: "UTC" },
    address: { type: String, required: true, trim: true },
    subscriptionPlan: {
        type: String,
        enum: Object.values(index_1.SubscriptionPlan),
        default: index_1.SubscriptionPlan.FREE,
    },
    subscriptionStatus: {
        type: String,
        enum: Object.values(index_1.SubscriptionStatus),
        default: index_1.SubscriptionStatus.TRIALING,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true, versionKey: false });
shopSchema.index({ ownerId: 1, isDeleted: 1 });
shopSchema.index({ ownerId: 1, slug: 1 }, { unique: true });
exports.Shop = (0, mongoose_1.model)("Shop", shopSchema);
//# sourceMappingURL=Shop.js.map