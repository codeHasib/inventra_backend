import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(200),
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
    businessType: z.string().min(1, "Business type is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Valid email is required"),
    address: z.string().min(1, "Address is required"),
    logo: z.string().optional(),
    currency: z.string().min(3).max(3).optional(),
    timezone: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Shop ID"),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    businessType: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email("Valid email is required").optional(),
    address: z.string().min(1).optional(),
    logo: z.string().optional(),
    currency: z.string().min(3).max(3).optional(),
    timezone: z.string().optional(),
  }),
});

export const shopIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Shop ID"),
  }),
});

export const listShopsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().optional(),
  }),
});
