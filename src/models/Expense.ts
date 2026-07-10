import { Schema, model, Document, Types } from "mongoose";
import { PaymentMethod } from "../enums/index";

export interface IExpense extends Document {
  shopId: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  expenseDate: Date;
  vendor: string;
  notes: string;
  receiptImage: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    expenseDate: { type: Date, default: Date.now },
    vendor: { type: String, default: "", trim: true, maxlength: 200 },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    receiptImage: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

expenseSchema.index({ shopId: 1, isDeleted: 1 });
expenseSchema.index({ shopId: 1, category: 1 });
expenseSchema.index({ shopId: 1, expenseDate: -1 });
expenseSchema.index({ shopId: 1, createdAt: -1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
