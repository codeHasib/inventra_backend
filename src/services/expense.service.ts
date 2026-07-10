import { Types } from "mongoose";
import { Expense, IExpense } from "../models/Expense";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { PaymentMethod } from "../enums/index";

// ─── Types ─────────────────────────────────────────────────────────

interface PaginationResult {
  expenses: IExpense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ExpenseStatistics {
  totalExpenses: number;
  totalAmount: number;
  averageExpense: number;
  categoryBreakdown: { category: string; total: number; count: number }[];
  paymentMethodBreakdown: { method: string; total: number; count: number }[];
  monthlyTrend: { month: string; total: number }[];
}

interface ListOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── CRUD ──────────────────────────────────────────────────────────

export const createExpense = async (
  shopId: string,
  data: {
    title: string;
    amount: number;
    category: string;
    paymentMethod: PaymentMethod;
    expenseDate?: string;
    vendor?: string;
    notes?: string;
    receiptImage?: string;
  },
): Promise<IExpense> => {
  return Expense.create({
    shopId: new Types.ObjectId(shopId),
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

export const getExpenses = async (
  shopId: string,
  options: ListOptions,
): Promise<PaginationResult> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const skip = (options.page - 1) * options.limit;

  const filter: Record<string, unknown> = {
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
    const dateFilter: Record<string, Date> = {};
    if (options.startDate) dateFilter.$gte = new Date(options.startDate);
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
    Expense.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    Expense.countDocuments(filter),
  ]);

  return {
    expenses,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
  };
};

export const getExpenseById = async (
  shopId: string,
  expenseId: string,
): Promise<IExpense> => {
  const expense = await Expense.findOne({
    _id: new Types.ObjectId(expenseId),
    shopId: new Types.ObjectId(shopId),
    isDeleted: false,
  });
  if (!expense) {
    throw new AppError("Expense not found", HTTP_STATUS.NOT_FOUND);
  }
  return expense;
};

export const updateExpense = async (
  shopId: string,
  expenseId: string,
  data: {
    title?: string;
    amount?: number;
    category?: string;
    paymentMethod?: PaymentMethod;
    expenseDate?: string;
    vendor?: string;
    notes?: string;
    receiptImage?: string;
  },
): Promise<IExpense> => {
  const updateFields: Record<string, unknown> = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.amount !== undefined) updateFields.amount = data.amount;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.paymentMethod !== undefined) updateFields.paymentMethod = data.paymentMethod;
  if (data.expenseDate !== undefined) updateFields.expenseDate = new Date(data.expenseDate);
  if (data.vendor !== undefined) updateFields.vendor = data.vendor;
  if (data.notes !== undefined) updateFields.notes = data.notes;
  if (data.receiptImage !== undefined) updateFields.receiptImage = data.receiptImage;

  const expense = await Expense.findOneAndUpdate(
    {
      _id: new Types.ObjectId(expenseId),
      shopId: new Types.ObjectId(shopId),
      isDeleted: false,
    },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!expense) {
    throw new AppError("Expense not found", HTTP_STATUS.NOT_FOUND);
  }
  return expense;
};

export const deleteExpense = async (
  shopId: string,
  expenseId: string,
): Promise<void> => {
  const expense = await Expense.findOneAndUpdate(
    {
      _id: new Types.ObjectId(expenseId),
      shopId: new Types.ObjectId(shopId),
      isDeleted: false,
    },
    { isDeleted: true },
  );
  if (!expense) {
    throw new AppError("Expense not found", HTTP_STATUS.NOT_FOUND);
  }
};

// ─── Statistics ────────────────────────────────────────────────────

export const getExpenseStatistics = async (
  shopId: string,
  startDate?: string,
  endDate?: string,
): Promise<ExpenseStatistics> => {
  const shopObjectId = new Types.ObjectId(shopId);

  const matchFilter: Record<string, unknown> = {
    shopId: shopObjectId,
    isDeleted: false,
  };

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    matchFilter.expenseDate = dateFilter;
  }

  const [totals, categoryBreakdown, paymentMethodBreakdown, monthlyTrend] =
    await Promise.all([
      Expense.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
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
      Expense.aggregate([
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
      Expense.aggregate([
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
