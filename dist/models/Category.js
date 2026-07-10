"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: { type: String, default: "", trim: true },
    color: { type: String, default: "#000000" },
    icon: { type: String, default: "default-icon" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
categorySchema.index({ shopId: 1, isDeleted: 1 });
categorySchema.index({ shopId: 1, name: 1 });
exports.Category = (0, mongoose_1.model)("Category", categorySchema);
//# sourceMappingURL=Category.js.map