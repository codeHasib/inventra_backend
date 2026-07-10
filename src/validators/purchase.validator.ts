import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "../enums/index";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const purchaseItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid Product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  purchasePrice: z.number().min(0, "Purchase price cannot be negative"),
});

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.string().regex(objectIdRegex, "Invalid Supplier ID"),
    invoiceNumber: z.string().optional(),
    purchaseDate: z.string().datetime().optional(),
    items: z
      .array(purchaseItemSchema)
      .min(1, "At least one item is required"),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    notes: z.string().optional(),
  }),
});

export const updatePurchaseSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Purchase ID"),
  }),
  body: z.object({
    supplierId: z.string().regex(objectIdRegex, "Invalid Supplier ID").optional(),
    purchaseDate: z.string().datetime().optional(),
    items: z
      .array(purchaseItemSchema)
      .min(1, "At least one item is required")
      .optional(),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    notes: z.string().optional(),
  }),
});

export const purchaseIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Purchase ID"),
  }),
});

export const listPurchasesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().optional(),
    supplierId: z.string().regex(objectIdRegex).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
