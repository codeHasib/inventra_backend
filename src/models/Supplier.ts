import { Schema, model, Document, Types } from "mongoose";

export interface ISupplier extends Document {
  shopId: Types.ObjectId;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  tradeLicense: string;
  notes: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    tradeLicense: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

supplierSchema.index({ shopId: 1, isDeleted: 1 });
supplierSchema.index({ shopId: 1, name: 1 }, { unique: true });

export const Supplier = model<ISupplier>("Supplier", supplierSchema);
