"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Purchase = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const purchaseItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
}, { _id: false });
const purchaseSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    supplierId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    purchaseDate: { type: Date, default: Date.now, index: true },
    items: { type: [purchaseItemSchema], required: true, validate: [(v) => v.length > 0, "At least one item is required"] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: {
        type: String,
        enum: Object.values(index_1.PaymentStatus),
        default: index_1.PaymentStatus.PENDING,
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: Object.values(index_1.PaymentMethod),
        required: true,
    },
    notes: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
purchaseSchema.index({ shopId: 1, isDeleted: 1 });
purchaseSchema.index({ shopId: 1, supplierId: 1 });
purchaseSchema.index({ shopId: 1, purchaseDate: -1 });
purchaseSchema.index({ shopId: 1, paymentStatus: 1 });
exports.Purchase = (0, mongoose_1.model)("Purchase", purchaseSchema);
//# sourceMappingURL=Purchase.js.map