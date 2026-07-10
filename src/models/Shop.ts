// src/models/Shop.ts
import { Schema, model, Document } from "mongoose";
import { SubscriptionPlan, SubscriptionStatus } from "../enums/index";

export interface IShop extends Document {
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
}

const shopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    businessType: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    logo: { type: String, default: "" },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    address: { type: String, required: true },
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
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export const Shop = model<IShop>("Shop", shopSchema);
