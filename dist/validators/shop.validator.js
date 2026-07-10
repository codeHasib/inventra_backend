"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listShopsSchema = exports.shopIdParamSchema = exports.updateShopSchema = exports.createShopSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.createShopSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").max(200),
        slug: zod_1.z
            .string()
            .min(1, "Slug is required")
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
        businessType: zod_1.z.string().min(1, "Business type is required"),
        phone: zod_1.z.string().min(1, "Phone is required"),
        email: zod_1.z.string().email("Valid email is required"),
        address: zod_1.z.string().min(1, "Address is required"),
        logo: zod_1.z.string().optional(),
        currency: zod_1.z.string().min(3).max(3).optional(),
        timezone: zod_1.z.string().optional(),
    }),
});
exports.updateShopSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Shop ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(200).optional(),
        businessType: zod_1.z.string().min(1).optional(),
        phone: zod_1.z.string().min(1).optional(),
        email: zod_1.z.string().email("Valid email is required").optional(),
        address: zod_1.z.string().min(1).optional(),
        logo: zod_1.z.string().optional(),
        currency: zod_1.z.string().min(3).max(3).optional(),
        timezone: zod_1.z.string().optional(),
    }),
});
exports.shopIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Shop ID"),
    }),
});
exports.listShopsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10).optional(),
        search: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=shop.validator.js.map