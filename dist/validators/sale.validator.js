"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topProductsSchema = exports.saleStatisticsSchema = exports.listSalesSchema = exports.saleIdParamSchema = exports.updateSaleSchema = exports.createSaleSchema = void 0;
const zod_1 = require("zod");
const index_1 = require("../enums/index");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string().regex(objectIdRegex, "Invalid Product ID"),
    quantity: zod_1.z.number().int().min(1, "Quantity must be at least 1"),
    unitPrice: zod_1.z.number().min(0, "Unit price cannot be negative"),
});
exports.createSaleSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z
            .array(saleItemSchema)
            .min(1, "At least one item is required"),
        discount: zod_1.z.number().min(0).optional(),
        tax: zod_1.z.number().min(0).optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod),
        paymentStatus: zod_1.z.nativeEnum(index_1.PaymentStatus).optional(),
        customerName: zod_1.z.string().max(200).optional(),
        customerPhone: zod_1.z.string().max(20).optional(),
        notes: zod_1.z.string().max(500).optional(),
    }),
});
exports.updateSaleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Sale ID"),
    }),
    body: zod_1.z.object({
        customerName: zod_1.z.string().max(200).optional(),
        customerPhone: zod_1.z.string().max(20).optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod).optional(),
        paymentStatus: zod_1.z.nativeEnum(index_1.PaymentStatus).optional(),
        notes: zod_1.z.string().max(500).optional(),
    }),
});
exports.saleIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Sale ID"),
    }),
});
exports.listSalesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10).optional(),
        search: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod).optional(),
        paymentStatus: zod_1.z.nativeEnum(index_1.PaymentStatus).optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
exports.saleStatisticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
exports.topProductsSchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(10).optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=sale.validator.js.map