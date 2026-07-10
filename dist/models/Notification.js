"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const notificationSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(index_1.NotificationType),
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, versionKey: false });
notificationSchema.index({ shopId: 1, isDeleted: 1, isRead: 1 });
notificationSchema.index({ shopId: 1, type: 1 });
notificationSchema.index({ shopId: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
//# sourceMappingURL=Notification.js.map