// src/models/Expense.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IExpense extends Document {
  shopId: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    expenseDate: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

export const Expense = model<IExpense>("Expense", expenseSchema);
