"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductsSchema = exports.updateStockSchema = exports.productIdParamSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const index_1 = require("../enums/index");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().regex(objectIdRegex, "Invalid Category ID"),
        supplierId: zod_1.z.string().regex(objectIdRegex, "Invalid Supplier ID"),
        name: zod_1.z.string().min(1, "Name is required").max(200),
        description: zod_1.z.string().optional(),
        sku: zod_1.z.string().optional(),
        barcode: zod_1.z.string().optional(),
        brand: zod_1.z.string().optional(),
        purchasePrice: zod_1.z.coerce.number().min(0, "Purchase price cannot be negative"),
        sellingPrice: zod_1.z.coerce.number().min(0, "Selling price cannot be negative"),
        currentStock: zod_1.z.coerce.number().min(0).optional(),
        minimumStock: zod_1.z.coerce.number().min(0).optional(),
        maximumStock: zod_1.z.coerce.number().min(0).optional(),
        reorderLevel: zod_1.z.coerce.number().min(0).optional(),
        unit: zod_1.z.string().min(1, "Unit is required"),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        expiryDate: zod_1.z.coerce.date().optional(),
        manufactureDate: zod_1.z.coerce.date().optional(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Product ID"),
    }),
    body: zod_1.z.object({
        categoryId: zod_1.z
            .string()
            .regex(objectIdRegex, "Invalid Category ID")
            .optional(),
        supplierId: zod_1.z
            .string()
            .regex(objectIdRegex, "Invalid Supplier ID")
            .optional(),
        name: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().optional(),
        sku: zod_1.z.string().optional(),
        barcode: zod_1.z.string().optional(),
        brand: zod_1.z.string().optional(),
        purchasePrice: zod_1.z.coerce.number().min(0).optional(),
        sellingPrice: zod_1.z.coerce.number().min(0).optional(),
        currentStock: zod_1.z.coerce.number().min(0).optional(),
        minimumStock: zod_1.z.coerce.number().min(0).optional(),
        maximumStock: zod_1.z.coerce.number().min(0).optional(),
        reorderLevel: zod_1.z.coerce.number().min(0).optional(),
        unit: zod_1.z.string().optional(),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        expiryDate: zod_1.z.coerce.date().nullable().optional(),
        manufactureDate: zod_1.z.coerce.date().nullable().optional(),
        status: zod_1.z.nativeEnum(index_1.ProductStatus).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.productIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Product ID"),
    }),
});
exports.updateStockSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Product ID"),
    }),
    body: zod_1.z.object({
        currentStock: zod_1.z.coerce.number().min(0, "Stock cannot be negative"),
    }),
});
exports.listProductsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10).optional(),
        search: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().regex(objectIdRegex).optional(),
        supplierId: zod_1.z.string().regex(objectIdRegex).optional(),
        status: zod_1.z.nativeEnum(index_1.ProductStatus).optional(),
        brand: zod_1.z.string().optional(),
        lowStock: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        outOfStock: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        isActive: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        sort: zod_1.z
            .enum(["newest", "oldest", "name-asc", "price-asc", "price-desc", "stock-asc", "stock-desc"])
            .optional(),
    }),
});
//# sourceMappingURL=product.validator.js.map