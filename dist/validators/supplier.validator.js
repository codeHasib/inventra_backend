"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSuppliersSchema = exports.supplierIdParamSchema = exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.createSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").max(200),
        company: zod_1.z.string().optional(),
        phone: zod_1.z.string().min(1, "Phone is required"),
        email: zod_1.z
            .string()
            .email("Valid email is required")
            .optional()
            .or(zod_1.z.literal("")),
        address: zod_1.z.string().optional(),
        tradeLicense: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.updateSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Supplier ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(200).optional(),
        company: zod_1.z.string().optional(),
        phone: zod_1.z.string().min(1).optional(),
        email: zod_1.z
            .string()
            .email("Valid email is required")
            .optional()
            .or(zod_1.z.literal("")),
        address: zod_1.z.string().optional(),
        tradeLicense: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.supplierIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, "Invalid Supplier ID"),
    }),
});
exports.listSuppliersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10).optional(),
        search: zod_1.z.string().optional(),
        isActive: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
    }),
});
//# sourceMappingURL=supplier.validator.js.map