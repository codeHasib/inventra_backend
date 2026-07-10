import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  refundSale,
  getSaleStatistics,
  getTopProducts,
} from "../services/sale.service";
import { PaymentMethod, PaymentStatus } from "../enums/index";

export const createSaleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const {
      items,
      discount,
      tax,
      paymentMethod,
      paymentStatus,
      customerName,
      customerPhone,
      notes,
    } = req.body;

    const sale = await createSale(shopId, {
      items,
      discount,
      tax,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      customerName,
      customerPhone,
      notes,
    });

    sendResponse(res, 201, "Sale created successfully", sale);
  },
);

export const listSalesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const paymentMethod = req.query.paymentMethod as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await getSales(shopId, {
      page,
      limit,
      search,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
    });

    sendResponse(res, 200, "Sales fetched successfully", result);
  },
);

export const getSaleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const saleId = req.params.id as string;
    const sale = await getSaleById(shopId, saleId);
    sendResponse(res, 200, "Sale fetched successfully", sale);
  },
);

export const updateSaleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const saleId = req.params.id as string;
    const { customerName, customerPhone, paymentMethod, paymentStatus, notes } =
      req.body;

    const sale = await updateSale(shopId, saleId, {
      customerName,
      customerPhone,
      paymentMethod: paymentMethod as PaymentMethod | undefined,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      notes,
    });

    sendResponse(res, 200, "Sale updated successfully", sale);
  },
);

export const deleteSaleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const saleId = req.params.id as string;
    await deleteSale(shopId, saleId);
    sendResponse(res, 200, "Sale deleted successfully");
  },
);

export const refundSaleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const saleId = req.params.id as string;
    const sale = await refundSale(shopId, saleId);
    sendResponse(res, 200, "Sale refunded successfully", sale);
  },
);

export const getSaleStatisticsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const statistics = await getSaleStatistics(shopId, startDate, endDate);
    sendResponse(
      res,
      200,
      "Sale statistics fetched successfully",
      statistics,
    );
  },
);

export const getTopProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const limit = Number(req.query.limit) || 10;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const topProducts = await getTopProducts(shopId, {
      limit,
      startDate,
      endDate,
    });

    sendResponse(
      res,
      200,
      "Top products fetched successfully",
      topProducts,
    );
  },
);
