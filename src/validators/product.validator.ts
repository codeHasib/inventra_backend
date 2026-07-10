// src/validators/product.validator.ts
import { z } from "zod";
import { ProductStatus } from "../enums/index";

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
    supplierId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Supplier ID"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional(),
    buyPrice: z.number().min(0, "Buy price cannot be negative"),
    sellPrice: z.number().min(0, "Sell price cannot be negative"),
    currentStock: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    unit: z.string().min(1, "Unit is required"),
    brand: z.string().optional(),
    images: z.array(z.string()).optional(),
    expiryDate: z.string().datetime().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID")
      .optional(),
    supplierId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Supplier ID")
      .optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    buyPrice: z.number().min(0).optional(),
    sellPrice: z.number().min(0).optional(),
    currentStock: z.number().min(0).optional(),
    minimumStock: z.number().min(0).optional(),
    unit: z.string().optional(),
    brand: z.string().optional(),
    images: z.array(z.string()).optional(),
    expiryDate: z.string().datetime().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
  }),
});
