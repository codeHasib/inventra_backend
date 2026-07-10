"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = void 0;
// src/models/Expense.ts
const mongoose_1 = require("mongoose");
const expenseSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    expenseDate: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });
exports.Expense = (0, mongoose_1.model)("Expense", expenseSchema);
//# sourceMappingURL=Expense.js.map