import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(200),
    company: z.string().optional(),
    phone: z.string().min(1, "Phone is required"),
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    tradeLicense: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Supplier ID"),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    company: z.string().optional(),
    phone: z.string().min(1).optional(),
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    tradeLicense: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const supplierIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid Supplier ID"),
  }),
});

export const listSuppliersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().optional(),
    isActive: z
      .string()
      .transform((val) => val === "true")
      .optional(),
  }),
});
