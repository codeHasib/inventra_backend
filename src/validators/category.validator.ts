import { z } from "zod";

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).trim().min(1),
    description: z.string().trim().optional(),
    color: z.string().trim().optional(),
    icon: z.string().trim().optional(),
  }),
});

export const UpdateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    color: z.string().trim().optional(),
    icon: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
});
