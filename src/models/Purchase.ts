import { Schema, model, Document, Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../enums/index";

export interface IPurchaseItem {
  productId: Types.ObjectId;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
}

export interface IPurchase extends Document {
  shopId: Types.ObjectId;
  supplierId: Types.ObjectId;
  invoiceNumber: string;
  purchaseDate: Date;
  items: IPurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const purchaseSchema = new Schema<IPurchase>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purchaseDate: { type: Date, default: Date.now, index: true },
    items: { type: [purchaseItemSchema], required: true, validate: [(v: IPurchaseItem[]) => v.length > 0, "At least one item is required"] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    notes: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

purchaseSchema.index({ shopId: 1, isDeleted: 1 });
purchaseSchema.index({ shopId: 1, supplierId: 1 });
purchaseSchema.index({ shopId: 1, purchaseDate: -1 });
purchaseSchema.index({ shopId: 1, paymentStatus: 1 });

export const Purchase = model<IPurchase>("Purchase", purchaseSchema);
