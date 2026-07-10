import { Expense, IExpense } from "../models/Expense";
import { AppError } from "../utils/AppError";

export const createExpense = async (
  shopId: string,
  data: Partial<IExpense>,
): Promise<IExpense> => {
  return await Expense.create({
    shopId,
    title: data.title,
    amount: data.amount,
    category: data.category,
    description: data.description,
    expenseDate: data.expenseDate,
  });
};

export const getExpenses = async (shopId: string): Promise<IExpense[]> => {
  return await Expense.find({ shopId }).sort({ expenseDate: -1 });
};

export const getExpenseById = async (
  shopId: string,
  expenseId: string,
): Promise<IExpense> => {
  const expense = await Expense.findOne({ _id: expenseId, shopId });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
};

export const updateExpense = async (
  shopId: string,
  expenseId: string,
  data: Partial<IExpense>,
): Promise<IExpense> => {
  const updateFields: Partial<IExpense> = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.amount !== undefined) updateFields.amount = data.amount;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.expenseDate !== undefined) updateFields.expenseDate = data.expenseDate;

  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, shopId },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
};

export const deleteExpense = async (
  shopId: string,
  expenseId: string,
): Promise<void> => {
  const expense = await Expense.findOneAndDelete({ _id: expenseId, shopId });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }
};
