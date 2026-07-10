"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const saleItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    profitPerUnit: { type: Number, required: true },
    total: { type: Number, required: true, min: 0 },
}, { _id: false });
const saleSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentMethod: {
        type: String,
        enum: Object.values(index_1.PaymentMethod),
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(index_1.PaymentStatus),
        default: index_1.PaymentStatus.PAID,
    },
    customerName: { type: String, default: "Walk-in Customer", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    saleDate: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
saleSchema.index({ shopId: 1, saleDate: -1 });
saleSchema.index({ shopId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ shopId: 1, paymentStatus: 1 });
saleSchema.index({ shopId: 1, paymentMethod: 1 });
saleSchema.index({ shopId: 1, isDeleted: 1 });
exports.Sale = (0, mongoose_1.model)("Sale", saleSchema);
//# sourceMappingURL=Sale.js.map