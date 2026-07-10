import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchaseStatistics,
} from "../services/purchase.service";
import { PaymentStatus, PaymentMethod } from "../enums/index";

export const createPurchaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const {
      supplierId,
      invoiceNumber,
      purchaseDate,
      items,
      discount,
      tax,
      paymentStatus,
      paymentMethod,
      notes,
    } = req.body;
    const purchase = await createPurchase(shopId, {
      supplierId,
      invoiceNumber,
      purchaseDate,
      items,
      discount,
      tax,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      paymentMethod: paymentMethod as PaymentMethod,
      notes,
    });
    sendResponse(res, 201, "Purchase created successfully", purchase);
  },
);

export const listPurchasesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const supplierId = req.query.supplierId as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await getPurchases(shopId, {
      page,
      limit,
      search,
      supplierId,
      paymentStatus,
      startDate,
      endDate,
    });
    sendResponse(res, 200, "Purchases fetched successfully", result);
  },
);

export const getPurchaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const purchaseId = req.params.id as string;
    const purchase = await getPurchaseById(shopId, purchaseId);
    sendResponse(res, 200, "Purchase fetched successfully", purchase);
  },
);

export const updatePurchaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const purchaseId = req.params.id as string;
    const {
      supplierId,
      purchaseDate,
      items,
      discount,
      tax,
      paymentStatus,
      paymentMethod,
      notes,
    } = req.body;
    const purchase = await updatePurchase(shopId, purchaseId, {
      supplierId,
      purchaseDate,
      items,
      discount,
      tax,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      paymentMethod: paymentMethod as PaymentMethod | undefined,
      notes,
    });
    sendResponse(res, 200, "Purchase updated successfully", purchase);
  },
);

export const deletePurchaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const purchaseId = req.params.id as string;
    await deletePurchase(shopId, purchaseId);
    sendResponse(res, 200, "Purchase deleted successfully");
  },
);

export const getPurchaseStatisticsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const statistics = await getPurchaseStatistics(shopId);
    sendResponse(
      res,
      200,
      "Purchase statistics fetched successfully",
      statistics,
    );
  },
);
