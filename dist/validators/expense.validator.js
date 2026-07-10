"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
const index_1 = require("../enums/index");
exports.createExpenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title is required").max(200),
        amount: zod_1.z.number().min(0.01, "Amount must be greater than 0"),
        category: zod_1.z.string().min(1, "Category is required").max(100),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod, {
            message: "Invalid payment method",
        }),
        expenseDate: zod_1.z.string().datetime().optional(),
        vendor: zod_1.z.string().max(200).optional(),
        notes: zod_1.z.string().max(500).optional(),
        receiptImage: zod_1.z.string().optional(),
    }),
});
exports.updateExpenseSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Expense ID"),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200).optional(),
        amount: zod_1.z.number().min(0.01).optional(),
        category: zod_1.z.string().min(1).max(100).optional(),
        paymentMethod: zod_1.z.nativeEnum(index_1.PaymentMethod).optional(),
        expenseDate: zod_1.z.string().datetime().optional(),
        vendor: zod_1.z.string().max(200).optional(),
        notes: zod_1.z.string().max(500).optional(),
        receiptImage: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=expense.validator.js.map