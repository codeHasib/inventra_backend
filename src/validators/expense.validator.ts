// src/validators/expense.validator.ts
import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    amount: z.number().min(0.01, 'Amount must be greater than zero'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    expenseDate: z.string().datetime().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    amount: z.number().min(0.01).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    expenseDate: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Expense ID'),
  }),
});