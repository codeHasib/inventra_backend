import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { reportService } from "../services/report.service";

type DateRange = "today" | "thisWeek" | "thisMonth" | "thisYear" | "last7Days" | "last30Days" | "custom";
type ReportFormat = "pdf" | "excel" | "csv";
type ReportType = "sales" | "purchases" | "inventory" | "expenses" | "profit" | "revenue";

const VALID_REPORT_TYPES = ["sales", "purchases", "inventory", "expenses", "profit", "revenue"];
const VALID_FORMATS = ["pdf", "excel", "csv"];
const VALID_DATE_RANGES = ["today", "thisWeek", "thisMonth", "thisYear", "last7Days", "last30Days", "custom"];

const getReportHandler = (reportType: ReportType) =>
  asyncHandler(async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const dateRange = (req.query.dateRange as DateRange) || "thisMonth";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const dateRangeResult = reportService.getDateRange(dateRange, startDate, endDate);

    let data: unknown;
    switch (reportType) {
      case "sales":
        data = await reportService.getSalesReport(shopId, dateRangeResult);
        break;
      case "purchases":
        data = await reportService.getPurchaseReport(shopId, dateRangeResult);
        break;
      case "inventory":
        data = await reportService.getInventoryReport(shopId);
        break;
      case "expenses":
        data = await reportService.getExpenseReport(shopId, dateRangeResult);
        break;
      case "profit":
        data = await reportService.getProfitReport(shopId, dateRangeResult);
        break;
      case "revenue":
        data = await reportService.getRevenueReport(shopId, dateRangeResult);
        break;
    }

    sendResponse(res, 200, `${reportType} report fetched successfully`, data);
  });

export const getSalesReportHandler = getReportHandler("sales");
export const getPurchaseReportHandler = getReportHandler("purchases");
export const getInventoryReportHandler = getReportHandler("inventory");
export const getExpenseReportHandler = getReportHandler("expenses");
export const getProfitReportHandler = getReportHandler("profit");
export const getRevenueReportHandler = getReportHandler("revenue");

export const exportReportHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const reportType = req.params.type as ReportType;
    const format = (req.query.format as ReportFormat) || "csv";
    const dateRange = (req.query.dateRange as DateRange) || "thisMonth";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!VALID_REPORT_TYPES.includes(reportType)) {
      sendResponse(res, 400, `Invalid report type. Valid types: ${VALID_REPORT_TYPES.join(", ")}`);
      return;
    }

    if (!VALID_FORMATS.includes(format)) {
      sendResponse(res, 400, `Invalid format. Valid formats: ${VALID_FORMATS.join(", ")}`);
      return;
    }

    if (!VALID_DATE_RANGES.includes(dateRange)) {
      sendResponse(res, 400, `Invalid date range. Valid ranges: ${VALID_DATE_RANGES.join(", ")}`);
      return;
    }

    const result = await reportService.generateReport(
      shopId,
      reportType,
      format,
      dateRange,
      startDate,
      endDate,
    );

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(result.data);
  },
);
