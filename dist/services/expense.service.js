"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.getExpenseById = exports.getExpenses = exports.createExpense = void 0;
const Expense_1 = require("../models/Expense");
const AppError_1 = require("../utils/AppError");
const createExpense = async (shopId, data) => {
    return await Expense_1.Expense.create({
        shopId,
        title: data.title,
        amount: data.amount,
        category: data.category,
        description: data.description,
        expenseDate: data.expenseDate,
    });
};
exports.createExpense = createExpense;
const getExpenses = async (shopId) => {
    return await Expense_1.Expense.find({ shopId }).sort({ expenseDate: -1 });
};
exports.getExpenses = getExpenses;
const getExpenseById = async (shopId, expenseId) => {
    const expense = await Expense_1.Expense.findOne({ _id: expenseId, shopId });
    if (!expense) {
        throw new AppError_1.AppError("Expense not found", 404);
    }
    return expense;
};
exports.getExpenseById = getExpenseById;
const updateExpense = async (shopId, expenseId, data) => {
    const updateFields = {};
    if (data.title !== undefined)
        updateFields.title = data.title;
    if (data.amount !== undefined)
        updateFields.amount = data.amount;
    if (data.category !== undefined)
        updateFields.category = data.category;
    if (data.description !== undefined)
        updateFields.description = data.description;
    if (data.expenseDate !== undefined)
        updateFields.expenseDate = data.expenseDate;
    const expense = await Expense_1.Expense.findOneAndUpdate({ _id: expenseId, shopId }, { $set: updateFields }, { new: true, runValidators: true });
    if (!expense) {
        throw new AppError_1.AppError("Expense not found", 404);
    }
    return expense;
};
exports.updateExpense = updateExpense;
const deleteExpense = async (shopId, expenseId) => {
    const expense = await Expense_1.Expense.findOneAndDelete({ _id: expenseId, shopId });
    if (!expense) {
        throw new AppError_1.AppError("Expense not found", 404);
    }
};
exports.deleteExpense = deleteExpense;
//# sourceMappingURL=expense.service.js.map