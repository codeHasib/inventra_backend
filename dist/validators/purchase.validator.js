"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPurchasesSchema = exports.purchaseIdParamSchema = exports.updatePurchaseSchema = exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
const index_1 = require("../enums/index");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const purchaseItemSchema = zod_1.z.object({
    productId: zod_1.z.string().regex(objectIdRegex, "Invalid Product ID"),
    quantity: zod_1.z.number().int().min(1, "Quantity must be at least 1"),
    purchasePrice: zod_1.z.number().min(0, "Purchase price cannot be negative"),
});
exports.createPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        supplierId: zod_1.z.string().regex(objectIdRegex, "Invalid Supplier ID"),
        invoiceNumber: zod_1.z.string().optional(),
        purchaseDate: zod_1.z.string().datetime().optional(),
        items: zod_1.z
            .array(purchaseItemSchema)
            .min(1, "At least one item is required"),
        discount: zod_1.z.number().min(0).optional(),
        tax: zod_1.z.number().min(0).optional(),
        paymentStatus: zod_1.z.nativeEnum(index_1.PaymentStatus).optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod),
        notes: zod_1.z.string().optional(),
    }),
});
exports.updatePurchaseSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Purchase ID"),
    }),
    body: zod_1.z.object({
        supplierId: zod_1.z.string().regex(objectIdRegex, "Invalid Supplier ID").optional(),
        purchaseDate: zod_1.z.string().datetime().optional(),
        items: zod_1.z
            .array(purchaseItemSchema)
            .min(1, "At least one item is required")
            .optional(),
        discount: zod_1.z.number().min(0).optional(),
        tax: zod_1.z.number().min(0).optional(),
        paymentStatus: zod_1.z.nativeEnum(index_1.PaymentStatus).optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod).optional(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.purchaseIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Purchase ID"),
    }),
});
exports.listPurchasesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10).optional(),
        search: zod_1.z.string().optional(),
        supplierId: zod_1.z.string().regex(objectIdRegex).optional(),
        paymentStatus: zod_1.z.nativeEnum(index_1.PaymentStatus).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
//# sourceMappingURL=purchase.validator.js.map