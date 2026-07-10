import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
    icon: z.string().max(50).optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Category ID"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
    icon: z.string().max(50).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Category ID"),
  }),
});
