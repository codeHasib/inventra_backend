import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { dashboardService } from "../services/dashboard.service";

export const getOverviewHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const overview = await dashboardService.getOverview(shopId);
    sendResponse(res, 200, "Dashboard overview fetched successfully", overview);
  },
);

export const getRevenueHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const revenue = await dashboardService.getRevenue(shopId);
    sendResponse(res, 200, "Revenue data fetched successfully", revenue);
  },
);

export const getSalesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const sales = await dashboardService.getSales(shopId);
    sendResponse(res, 200, "Sales data fetched successfully", sales);
  },
);

export const getInventoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const inventory = await dashboardService.getInventory(shopId);
    sendResponse(
      res,
      200,
      "Inventory data fetched successfully",
      inventory,
    );
  },
);

export const getChartsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const charts = await dashboardService.getCharts(shopId);
    sendResponse(res, 200, "Chart data fetched successfully", charts);
  },
);

export const getTopProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const limit = Number(req.query.limit) || 10;
    const topProducts = await dashboardService.getTopProducts(shopId, limit);
    sendResponse(
      res,
      200,
      "Top products data fetched successfully",
      topProducts,
    );
  },
);

export const getWarningsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const warnings = await dashboardService.getWarnings(shopId);
    sendResponse(
      res,
      200,
      "Warnings data fetched successfully",
      warnings,
    );
  },
);
