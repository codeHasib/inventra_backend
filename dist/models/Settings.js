"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const mongoose_1 = require("mongoose");
const settingsSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        unique: true,
    },
    businessName: { type: String, default: "", trim: true, maxlength: 200 },
    logo: { type: String, default: "" },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    currency: { type: String, default: "USD", uppercase: true, maxlength: 3 },
    timezone: { type: String, default: "UTC", trim: true },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    invoicePrefix: { type: String, default: "INV-", trim: true, maxlength: 10 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    businessType: { type: String, default: "", trim: true },
}, { timestamps: true, versionKey: false });
exports.Settings = (0, mongoose_1.model)("Settings", settingsSchema);
//# sourceMappingURL=Settings.js.map