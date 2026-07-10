"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
// src/validators/expense.validator.ts
const zod_1 = require("zod");
exports.createExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        amount: zod_1.z.number().min(0.01, 'Amount must be greater than zero'),
        category: zod_1.z.string().min(1, 'Category is required'),
        description: zod_1.z.string().optional(),
        expenseDate: zod_1.z.string().datetime().optional(),
    }),
});
exports.updateExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        amount: zod_1.z.number().min(0.01).optional(),
        category: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        expenseDate: zod_1.z.string().datetime().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Expense ID'),
    }),
});
//# sourceMappingURL=expense.validator.js.map