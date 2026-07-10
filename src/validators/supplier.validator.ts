// src/validators/supplier.validator.ts
import { z } from "zod";

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    company: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    company: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Supplier ID"),
  }),
});
