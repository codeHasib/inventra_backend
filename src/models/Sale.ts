import { Schema, model, Document, Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../enums/index";

export interface ISaleItem {
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  profitPerUnit: number;
  total: number;
}

export interface ISale extends Document {
  shopId: Types.ObjectId;
  invoiceNumber: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  notes: string;
  saleDate: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    profitPerUnit: { type: Number, required: true },
    total: { type: Number, required: true, min: 0 },
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
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PAID,
    },
    customerName: { type: String, default: "Walk-in Customer", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    saleDate: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

saleSchema.index({ shopId: 1, saleDate: -1 });
saleSchema.index({ shopId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ shopId: 1, paymentStatus: 1 });
saleSchema.index({ shopId: 1, paymentMethod: 1 });
saleSchema.index({ shopId: 1, isDeleted: 1 });

export const Sale = model<ISale>("Sale", saleSchema);
