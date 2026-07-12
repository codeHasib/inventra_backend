import { z } from "zod";
import { ProductStatus } from "../enums/index";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.string().regex(objectIdRegex, "Invalid Category ID"),
    supplierId: z.string().regex(objectIdRegex, "Invalid Supplier ID"),
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    brand: z.string().optional(),
    purchasePrice: z.coerce.number().min(0, "Purchase price cannot be negative"),
    sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
    currentStock: z.coerce.number().min(0).optional(),
    minimumStock: z.coerce.number().min(0).optional(),
    maximumStock: z.coerce.number().min(0).optional(),
    reorderLevel: z.coerce.number().min(0).optional(),
    unit: z.string().min(1, "Unit is required"),
    images: z.array(z.string()).optional(),
    expiryDate: z.coerce.date().optional(),
    manufactureDate: z.coerce.date().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Product ID"),
  }),
  body: z.object({
    categoryId: z
      .string()
      .regex(objectIdRegex, "Invalid Category ID")
      .optional(),
    supplierId: z
      .string()
      .regex(objectIdRegex, "Invalid Supplier ID")
      .optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    brand: z.string().optional(),
    purchasePrice: z.coerce.number().min(0).optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    currentStock: z.coerce.number().min(0).optional(),
    minimumStock: z.coerce.number().min(0).optional(),
    maximumStock: z.coerce.number().min(0).optional(),
    reorderLevel: z.coerce.number().min(0).optional(),
    unit: z.string().optional(),
    images: z.array(z.string()).optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    manufactureDate: z.coerce.date().nullable().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Product ID"),
  }),
});

export const updateStockSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Product ID"),
  }),
  body: z.object({
    currentStock: z.coerce.number().min(0, "Stock cannot be negative"),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().optional(),
    categoryId: z.string().regex(objectIdRegex).optional(),
    supplierId: z.string().regex(objectIdRegex).optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    brand: z.string().optional(),
    lowStock: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    outOfStock: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    sort: z
      .enum(["newest", "oldest", "name-asc", "price-asc", "price-desc", "stock-asc", "stock-desc"])
      .optional(),
  }),
});
