import { Schema, model, Document, Types } from "mongoose";
import { NotificationType } from "../enums/index";

export interface INotification extends Document {
  shopId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  productId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ shopId: 1, isDeleted: 1, isRead: 1 });
notificationSchema.index({ shopId: 1, type: 1 });
notificationSchema.index({ shopId: 1, createdAt: -1 });

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
