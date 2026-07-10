// src/validators/sale.validator.ts
import { z } from 'zod';
import { PaymentMethod } from '../enums/index';

const saleItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Product ID'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export const createSaleSchema = z.object({
  body: z.object({
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    customerName: z.string().optional(),
    notes: z.string().optional(),
  }),
});