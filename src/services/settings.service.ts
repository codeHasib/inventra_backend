import { Types } from "mongoose";
import { Settings, ISettings } from "../models/Settings";
import { Shop } from "../models/Shop";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

// ─── Get Profile ───────────────────────────────────────────────────

export const getProfile = async (shopId: string): Promise<ISettings> => {
  const settings = await Settings.findOne({
    shopId: new Types.ObjectId(shopId),
  });

  if (!settings) {
    return createDefaultSettings(shopId);
  }

  return settings;
};

// ─── Update Profile ────────────────────────────────────────────────

export const updateProfile = async (
  shopId: string,
  data: {
    businessName?: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    currency?: string;
    timezone?: string;
    taxPercentage?: number;
    invoicePrefix?: string;
    lowStockThreshold?: number;
    businessType?: string;
  },
): Promise<ISettings> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const updateFields: Record<string, unknown> = {};

  if (data.businessName !== undefined) updateFields.businessName = data.businessName;
  if (data.logo !== undefined) updateFields.logo = data.logo;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.currency !== undefined) updateFields.currency = data.currency.toUpperCase();
  if (data.timezone !== undefined) updateFields.timezone = data.timezone;
  if (data.taxPercentage !== undefined) updateFields.taxPercentage = data.taxPercentage;
  if (data.invoicePrefix !== undefined) updateFields.invoicePrefix = data.invoicePrefix;
  if (data.lowStockThreshold !== undefined) updateFields.lowStockThreshold = data.lowStockThreshold;
  if (data.businessType !== undefined) updateFields.businessType = data.businessType;

  let settings = await Settings.findOne({ shopId: shopObjectId });

  if (!settings) {
    settings = await Settings.create({
      shopId: shopObjectId,
      ...updateFields,
    });
  } else {
    settings = await Settings.findOneAndUpdate(
      { shopId: shopObjectId },
      { $set: updateFields },
      { new: true, runValidators: true },
    );
  }

  if (!settings) {
    throw new AppError("Failed to update settings", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Sync key fields back to Shop model
  const shopUpdates: Record<string, unknown> = {};
  if (data.businessName !== undefined) shopUpdates.name = data.businessName;
  if (data.logo !== undefined) shopUpdates.logo = data.logo;
  if (data.phone !== undefined) shopUpdates.phone = data.phone;
  if (data.email !== undefined) shopUpdates.email = data.email;
  if (data.address !== undefined) shopUpdates.address = data.address;
  if (data.currency !== undefined) shopUpdates.currency = data.currency.toUpperCase();
  if (data.timezone !== undefined) shopUpdates.timezone = data.timezone;
  if (data.businessType !== undefined) shopUpdates.businessType = data.businessType;

  if (Object.keys(shopUpdates).length > 0) {
    await Shop.findOneAndUpdate(
      { _id: shopObjectId, isDeleted: false },
      { $set: shopUpdates },
    );
  }

  return settings;
};

// ─── Helpers ───────────────────────────────────────────────────────

const createDefaultSettings = async (shopId: string): Promise<ISettings> => {
  const shop = await Shop.findOne({
    _id: new Types.ObjectId(shopId),
    isDeleted: false,
  });

  return Settings.create({
    shopId: new Types.ObjectId(shopId),
    businessName: shop?.name || "",
    logo: shop?.logo || "",
    phone: shop?.phone || "",
    email: shop?.email || "",
    address: shop?.address || "",
    currency: shop?.currency || "USD",
    timezone: shop?.timezone || "UTC",
    businessType: shop?.businessType || "",
    taxPercentage: 0,
    invoicePrefix: "INV-",
    lowStockThreshold: 10,
  });
};
