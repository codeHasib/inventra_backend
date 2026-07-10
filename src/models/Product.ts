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
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  profitMargin: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  unit: string;
  images: string[];
  expiryDate: Date | null;
  manufactureDate: Date | null;
  status: ProductStatus;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
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
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, default: "", trim: true },
    brand: { type: String, default: "", trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    profitMargin: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 5, min: 0 },
    maximumStock: { type: Number, default: 1000, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    unit: { type: String, required: true, trim: true },
    images: [{ type: String }],
    expiryDate: { type: Date, default: null },
    manufactureDate: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ shopId: 1, isDeleted: 1 });
productSchema.index({ shopId: 1, name: 1, sku: 1 }, { unique: true });
productSchema.index({ shopId: 1, barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ shopId: 1, categoryId: 1 });
productSchema.index({ shopId: 1, supplierId: 1 });

export const Product = model<IProduct>("Product", productSchema);
