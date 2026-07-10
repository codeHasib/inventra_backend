// src/models/Category.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  shopId: Types.ObjectId;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  isDeleted: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#000000" },
    icon: { type: String, default: "default-icon" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export const Category = model<ICategory>("Category", categorySchema);
