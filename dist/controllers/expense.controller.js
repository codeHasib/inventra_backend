"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenseStatisticsHandler = exports.deleteExpenseHandler = exports.updateExpenseHandler = exports.getExpenseByIdHandler = exports.getExpensesHandler = exports.createExpenseHandler = exports.getAllExpensesHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const expenseService = __importStar(require("../services/expense.service"));
const VALID_SORT_FIELDS = ["amount", "expenseDate", "createdAt", "title"];
const VALID_SORT_ORDERS = ["asc", "desc"];
const getAllExpensesHandler = async (req, res) => {
    try {
        if (!req.user?.shopId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
        }
        const expenses = await expenseService.getAllExpenses(req.user.shopId);
        res.json({ success: true, message: "Expenses fetched", data: expenses });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error occurred while fetching data." });
    }
};
exports.getAllExpensesHandler = getAllExpensesHandler;
exports.createExpenseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const { title, amount, category, paymentMethod, expenseDate, vendor, notes, receiptImage } = req.body;
    const expense = await expenseService.createExpense(shopId, {
        title,
        amount,
        category,
        paymentMethod,
        expenseDate,
        vendor,
        notes,
        receiptImage,
    });
    (0, response_1.sendResponse)(res, 201, "Expense created successfully", expense);
});
exports.getExpensesHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search;
    const category = req.query.category;
    const paymentMethod = req.query.paymentMethod;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sortBy = req.query.sortBy || "expenseDate";
    const sortOrder = req.query.sortOrder || "desc";
    if (!VALID_SORT_FIELDS.includes(sortBy)) {
        (0, response_1.sendResponse)(res, 400, `Invalid sortBy. Valid: ${VALID_SORT_FIELDS.join(", ")}`);
        return;
    }
    const result = await expenseService.getExpenses(shopId, {
        page,
        limit,
        search,
        category,
        paymentMethod,
        startDate,
        endDate,
        sortBy,
        sortOrder,
    });
    (0, response_1.sendResponse)(res, 200, "Expenses fetched successfully", result);
});
exports.getExpenseByIdHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const id = req.params.id;
    const expense = await expenseService.getExpenseById(shopId, id);
    (0, response_1.sendResponse)(res, 200, "Expense fetched successfully", expense);
});
exports.updateExpenseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const id = req.params.id;
    const { title, amount, category, paymentMethod, expenseDate, vendor, notes, receiptImage } = req.body;
    const expense = await expenseService.updateExpense(shopId, id, {
        title,
        amount,
        category,
        paymentMethod,
        expenseDate,
        vendor,
        notes,
        receiptImage,
    });
    (0, response_1.sendResponse)(res, 200, "Expense updated successfully", expense);
});
exports.deleteExpenseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const id = req.params.id;
    await expenseService.deleteExpense(shopId, id);
    (0, response_1.sendResponse)(res, 200, "Expense deleted successfully");
});
exports.getExpenseStatisticsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const stats = await expenseService.getExpenseStatistics(shopId, startDate, endDate);
    (0, response_1.sendResponse)(res, 200, "Expense statistics fetched successfully", stats);
});
//# sourceMappingURL=expense.controller.js.map