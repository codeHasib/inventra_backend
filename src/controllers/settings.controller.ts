import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import * as settingsService from "../services/settings.service";

export const getProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;

    const settings = await settingsService.getProfile(shopId);

    sendResponse(res, 200, "Settings fetched successfully", settings);
  },
);

export const updateProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const {
      businessName,
      logo,
      phone,
      email,
      address,
      currency,
      timezone,
      taxPercentage,
      invoicePrefix,
      lowStockThreshold,
      businessType,
    } = req.body;

    const settings = await settingsService.updateProfile(shopId, {
      businessName,
      logo,
      phone,
      email,
      address,
      currency,
      timezone,
      taxPercentage,
      invoicePrefix,
      lowStockThreshold,
      businessType,
    });

    sendResponse(res, 200, "Settings updated successfully", settings);
  },
);
