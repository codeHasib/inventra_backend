// src/models/Sale.ts
import { Schema, model, Document, Types } from "mongoose";
import { PaymentMethod } from "../enums/index";

export interface ISaleItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale extends Document {
  shopId: Types.ObjectId;
  invoiceNumber: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  notes: string;
  saleDate: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    customerName: { type: String, default: "Walk-in Customer" },
    notes: { type: String, default: "" },
    saleDate: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

export const Sale = model<ISale>("Sale", saleSchema);
