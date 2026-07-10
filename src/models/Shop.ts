import { Schema, model, Document } from "mongoose";
import { SubscriptionPlan, SubscriptionStatus } from "../enums/index";

export interface IShop extends Document {
  ownerId: string;
  name: string;
  slug: string;
  businessType: string;
  phone: string;
  email: string;
  logo: string;
  currency: string;
  timezone: string;
  address: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    logo: { type: String, default: "" },
    currency: { type: String, default: "USD", uppercase: true },
    timezone: { type: String, default: "UTC" },
    address: { type: String, required: true, trim: true },
    subscriptionPlan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.FREE,
    },
    subscriptionStatus: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.TRIALING,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
);

shopSchema.index({ ownerId: 1, isDeleted: 1 });
shopSchema.index({ ownerId: 1, slug: 1 }, { unique: true });

export const Shop = model<IShop>("Shop", shopSchema);
