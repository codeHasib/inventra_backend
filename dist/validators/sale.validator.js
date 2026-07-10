"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaleSchema = void 0;
// src/validators/sale.validator.ts
const zod_1 = require("zod");
const index_1 = require("../enums/index");
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: zod_1.z.number().min(0, 'Unit price cannot be negative'),
});
exports.createSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z.array(saleItemSchema).min(1, 'At least one item is required'),
        discount: zod_1.z.number().min(0).optional(),
        tax: zod_1.z.number().min(0).optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod),
        customerName: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=sale.validator.js.map