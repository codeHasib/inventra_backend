"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supplier = void 0;
const mongoose_1 = require("mongoose");
const supplierSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    tradeLicense: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
supplierSchema.index({ shopId: 1, isDeleted: 1 });
supplierSchema.index({ shopId: 1, name: 1 }, { unique: true });
exports.Supplier = (0, mongoose_1.model)("Supplier", supplierSchema);
//# sourceMappingURL=Supplier.js.map