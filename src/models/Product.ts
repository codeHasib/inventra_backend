// src/models/Product.ts
import { Schema, model, Document, Types } from "mongoose";
import { ProductStatus } from "../enums/index";

export interface IProduct extends Document {
  shopId: Types.ObjectId;
  categoryId: Types.ObjectId;
  supplierId: Types.ObjectId;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  brand: string;
  images: string[];
  expiryDate: Date;
  status: ProductStatus;
  isActive: boolean;
  isDeleted: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    sku: { type: String, required: true, index: true },
    barcode: { type: String, default: "" },
    buyPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 5 },
    unit: { type: String, required: true },
    brand: { type: String, default: "" },
    images: [{ type: String }],
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.AVAILABLE,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export const Product = model<IProduct>("Product", productSchema);
