import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import * as expenseService from "../services/expense.service";
import { PaymentMethod } from "../enums/index";

const VALID_SORT_FIELDS = ["amount", "expenseDate", "createdAt", "title"];
const VALID_SORT_ORDERS = ["asc", "desc"];

export const getAllExpensesHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
    }

    const expenses = await expenseService.getAllExpenses(req.user.shopId);

    res.json({ success: true, message: "Expenses fetched", data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error occurred while fetching data." });
  }
};

export const createExpenseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
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

    sendResponse(res, 201, "Expense created successfully", expense);
  },
);

export const getExpensesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const paymentMethod = req.query.paymentMethod as PaymentMethod | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const sortBy = (req.query.sortBy as string) || "expenseDate";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      sendResponse(res, 400, `Invalid sortBy. Valid: ${VALID_SORT_FIELDS.join(", ")}`);
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

    sendResponse(res, 200, "Expenses fetched successfully", result);
  },
);

export const getExpenseByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const id = req.params.id as string;

    const expense = await expenseService.getExpenseById(shopId, id);

    sendResponse(res, 200, "Expense fetched successfully", expense);
  },
);

export const updateExpenseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const id = req.params.id as string;
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

    sendResponse(res, 200, "Expense updated successfully", expense);
  },
);

export const deleteExpenseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const id = req.params.id as string;

    await expenseService.deleteExpense(shopId, id);

    sendResponse(res, 200, "Expense deleted successfully");
  },
);

export const getExpenseStatisticsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const stats = await expenseService.getExpenseStatistics(shopId, startDate, endDate);

    sendResponse(res, 200, "Expense statistics fetched successfully", stats);
  },
);
