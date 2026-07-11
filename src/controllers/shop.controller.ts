import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import {
  createShop,
  createFirstShop,
  getShopById,
  getShopsByOwner,
  updateShop,
  deleteShop,
} from "../services/shop.service";

export const createShopHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const { name, slug, businessType, phone, email, address, logo, currency, timezone } =
      req.body;
    const shop = await createShop(ownerId, {
      name,
      slug,
      businessType,
      phone,
      email,
      address,
      logo,
      currency,
      timezone,
    });
    sendResponse(res, 201, "Shop created successfully", shop);
  },
);

export const createFirstShopHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, slug, businessType, phone, email, address, logo, currency, timezone } =
      req.body;
    const shop = await createFirstShop(userId, {
      name,
      slug,
      businessType,
      phone,
      email,
      address,
      logo,
      currency,
      timezone,
    });
    sendResponse(res, 201, "Shop created successfully", shop);
  },
);

export const getShopHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const shopId = req.params.id as string;
    const shop = await getShopById(ownerId, shopId);
    sendResponse(res, 200, "Shop fetched successfully", shop);
  },
);

export const listShopsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;

    const result = await getShopsByOwner(ownerId, { page, limit, search });
    sendResponse(res, 200, "Shops fetched successfully", result);
  },
);

export const updateShopHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const shopId = req.params.id as string;
    const { name, businessType, phone, email, address, logo, currency, timezone } =
      req.body;
    const shop = await updateShop(ownerId, shopId, {
      name,
      businessType,
      phone,
      email,
      address,
      logo,
      currency,
      timezone,
    });
    sendResponse(res, 200, "Shop updated successfully", shop);
  },
);

export const deleteShopHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const shopId = req.params.id as string;
    await deleteShop(ownerId, shopId);
    sendResponse(res, 200, "Shop deleted successfully");
  },
);
