import { z } from "zod";
import { PaymentMethod } from "../enums/index";

export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    category: z.string().min(1, "Category is required").max(100),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      message: "Invalid payment method",
    }),
    expenseDate: z.coerce.date().optional(),
    vendor: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
    receiptImage: z.string().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Expense ID"),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    amount: z.number().min(0.01).optional(),
    category: z.string().min(1).max(100).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    expenseDate: z.coerce.date().optional(),
    vendor: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
    receiptImage: z.string().optional(),
  }),
});
