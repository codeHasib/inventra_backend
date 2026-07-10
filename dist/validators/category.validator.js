"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryIdParamSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").max(100),
        description: zod_1.z.string().optional(),
        color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
        icon: zod_1.z.string().max(50).optional(),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Category ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        description: zod_1.z.string().optional(),
        color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
        icon: zod_1.z.string().max(50).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.categoryIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Category ID"),
    }),
});
//# sourceMappingURL=category.validator.js.map