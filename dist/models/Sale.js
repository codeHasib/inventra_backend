"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = void 0;
// src/models/Sale.ts
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const saleItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });
const saleSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
        type: String,
        enum: Object.values(index_1.PaymentMethod),
        required: true,
    },
    customerName: { type: String, default: "Walk-in Customer" },
    notes: { type: String, default: "" },
    saleDate: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });
exports.Sale = (0, mongoose_1.model)("Sale", saleSchema);
//# sourceMappingURL=Sale.js.map