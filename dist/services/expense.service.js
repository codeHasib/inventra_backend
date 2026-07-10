"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenseStatistics = exports.deleteExpense = exports.updateExpense = exports.getExpenseById = exports.getExpenses = exports.createExpense = void 0;
const mongoose_1 = require("mongoose");
const Expense_1 = require("../models/Expense");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
// ─── CRUD ──────────────────────────────────────────────────────────
const createExpense = async (shopId, data) => {
    return Expense_1.Expense.create({
        shopId: new mongoose_1.Types.ObjectId(shopId),
        title: data.title,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        vendor: data.vendor || "",
        notes: data.notes || "",
        receiptImage: data.receiptImage || "",
        isDeleted: false,
    });
};
exports.createExpense = createExpense;
const getExpenses = async (shopId, options) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const skip = (options.page - 1) * options.limit;
    const filter = {
        shopId: shopObjectId,
        isDeleted: false,
    };
    if (options.search) {
        const regex = new RegExp(options.search, "i");
        filter.$or = [
            { title: regex },
            { vendor: regex },
            { notes: regex },
            { category: regex },
        ];
    }
    if (options.category) {
        filter.category = options.category;
    }
    if (options.paymentMethod) {
        filter.paymentMethod = options.paymentMethod;
    }
    if (options.startDate || options.endDate) {
        const dateFilter = {};
        if (options.startDate)
            dateFilter.$gte = new Date(options.startDate);
        if (options.endDate) {
            const end = new Date(options.endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }
        filter.expenseDate = dateFilter;
    }
    const sortField = options.sortBy || "expenseDate";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    const [expenses, total] = await Promise.all([
        Expense_1.Expense.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(options.limit)
            .lean(),
        Expense_1.Expense.countDocuments(filter),
    ]);
    return {
        expenses,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
    };
};
exports.getExpenses = getExpenses;
const getExpenseById = async (shopId, expenseId) => {
    const expense = await Expense_1.Expense.findOne({
        _id: new mongoose_1.Types.ObjectId(expenseId),
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    });
    if (!expense) {
        throw new AppError_1.AppError("Expense not found", index_1.HTTP_STATUS.NOT_FOUND);
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
    if (data.paymentMethod !== undefined)
        updateFields.paymentMethod = data.paymentMethod;
    if (data.expenseDate !== undefined)
        updateFields.expenseDate = new Date(data.expenseDate);
    if (data.vendor !== undefined)
        updateFields.vendor = data.vendor;
    if (data.notes !== undefined)
        updateFields.notes = data.notes;
    if (data.receiptImage !== undefined)
        updateFields.receiptImage = data.receiptImage;
    const expense = await Expense_1.Expense.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(expenseId),
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    }, { $set: updateFields }, { new: true, runValidators: true });
    if (!expense) {
        throw new AppError_1.AppError("Expense not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return expense;
};
exports.updateExpense = updateExpense;
const deleteExpense = async (shopId, expenseId) => {
    const expense = await Expense_1.Expense.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(expenseId),
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    }, { isDeleted: true });
    if (!expense) {
        throw new AppError_1.AppError("Expense not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
};
exports.deleteExpense = deleteExpense;
// ─── Statistics ────────────────────────────────────────────────────
const getExpenseStatistics = async (shopId, startDate, endDate) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const matchFilter = {
        shopId: shopObjectId,
        isDeleted: false,
    };
    if (startDate || endDate) {
        const dateFilter = {};
        if (startDate)
            dateFilter.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }
        matchFilter.expenseDate = dateFilter;
    }
    const [totals, categoryBreakdown, paymentMethodBreakdown, monthlyTrend] = await Promise.all([
        Expense_1.Expense.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]),
        Expense_1.Expense.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]),
        Expense_1.Expense.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$paymentMethod",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]),
        Expense_1.Expense.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        year: { $year: "$expenseDate" },
                        month: { $month: "$expenseDate" },
                    },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 },
        ]),
    ]);
    const summary = totals[0] || { totalAmount: 0, count: 0 };
    return {
        totalExpenses: summary.count,
        totalAmount: summary.totalAmount,
        averageExpense: summary.count > 0 ? Number((summary.totalAmount / summary.count).toFixed(2)) : 0,
        categoryBreakdown: categoryBreakdown.map((c) => ({
            category: c._id,
            total: c.total,
            count: c.count,
        })),
        paymentMethodBreakdown: paymentMethodBreakdown.map((p) => ({
            method: p._id,
            total: p.total,
            count: p.count,
        })),
        monthlyTrend: monthlyTrend.map((m) => ({
            month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
            total: m.total,
        })),
    };
};
exports.getExpenseStatistics = getExpenseStatistics;
//# sourceMappingURL=expense.service.js.map