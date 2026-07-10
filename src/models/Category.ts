import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  shopId: Types.ObjectId;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: { type: String, default: "", trim: true },
    color: { type: String, default: "#000000" },
    icon: { type: String, default: "default-icon" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

categorySchema.index({ shopId: 1, isDeleted: 1 });
categorySchema.index({ shopId: 1, name: 1 });

export const Category = model<ICategory>("Category", categorySchema);
