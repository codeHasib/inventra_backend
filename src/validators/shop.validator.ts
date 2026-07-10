// src/validators/shop.validator.ts
import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    businessType: z.string().min(1, 'Business type is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email('Valid email is required'),
    address: z.string().min(1, 'Address is required'),
    logo: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    businessType: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Valid email is required').optional(),
    address: z.string().optional(),
    logo: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Shop ID'),
  }),
});