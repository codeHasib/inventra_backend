import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "../enums/index";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const saleItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid Product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
});

export const createSaleSchema = z.object({
  body: z.object({
    items: z
      .array(saleItemSchema)
      .min(1, "At least one item is required"),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    customerName: z.string().max(200).optional(),
    customerPhone: z.string().max(20).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateSaleSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Sale ID"),
  }),
  body: z.object({
    customerName: z.string().max(200).optional(),
    customerPhone: z.string().max(20).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const saleIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Sale ID"),
  }),
});

export const listSalesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const saleStatisticsSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const topProductsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
