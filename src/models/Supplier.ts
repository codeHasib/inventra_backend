// src/models/Supplier.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ISupplier extends Document {
  shopId: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  address: string;
  company: string;
  notes: string;
  isActive: boolean;
  isDeleted: boolean;
}

const supplierSchema = new Schema<ISupplier>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    company: { type: String, default: "" },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export const Supplier = model<ISupplier>("Supplier", supplierSchema);
