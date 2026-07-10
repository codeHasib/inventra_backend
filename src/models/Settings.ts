import { Schema, model, Document, Types } from "mongoose";

export interface ISettings extends Document {
  shopId: Types.ObjectId;
  businessName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  timezone: string;
  taxPercentage: number;
  invoicePrefix: string;
  lowStockThreshold: number;
  businessType: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      unique: true,
    },
    businessName: { type: String, default: "", trim: true, maxlength: 200 },
    logo: { type: String, default: "" },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    currency: { type: String, default: "USD", uppercase: true, maxlength: 3 },
    timezone: { type: String, default: "UTC", trim: true },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    invoicePrefix: { type: String, default: "INV-", trim: true, maxlength: 10 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    businessType: { type: String, default: "", trim: true },
  },
  { timestamps: true, versionKey: false },
);

settingsSchema.index({ shopId: 1 });

export const Settings = model<ISettings>("Settings", settingsSchema);
