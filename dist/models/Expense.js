"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const expenseSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    paymentMethod: {
        type: String,
        enum: Object.values(index_1.PaymentMethod),
        required: true,
    },
    expenseDate: { type: Date, default: Date.now },
    vendor: { type: String, default: "", trim: true, maxlength: 200 },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    receiptImage: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
expenseSchema.index({ shopId: 1, isDeleted: 1 });
expenseSchema.index({ shopId: 1, category: 1 });
expenseSchema.index({ shopId: 1, expenseDate: -1 });
expenseSchema.index({ shopId: 1, createdAt: -1 });
exports.Expense = (0, mongoose_1.model)("Expense", expenseSchema);
//# sourceMappingURL=Expense.js.map