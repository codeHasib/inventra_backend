"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReportHandler = exports.getRevenueReportHandler = exports.getProfitReportHandler = exports.getExpenseReportHandler = exports.getInventoryReportHandler = exports.getPurchaseReportHandler = exports.getSalesReportHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const report_service_1 = require("../services/report.service");
const VALID_REPORT_TYPES = ["sales", "purchases", "inventory", "expenses", "profit", "revenue"];
const VALID_FORMATS = ["pdf", "excel", "csv"];
const VALID_DATE_RANGES = ["today", "thisWeek", "thisMonth", "thisYear", "last7Days", "last30Days", "custom"];
const getReportHandler = (reportType) => (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const dateRange = req.query.dateRange || "thisMonth";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const dateRangeResult = report_service_1.reportService.getDateRange(dateRange, startDate, endDate);
    let data;
    switch (reportType) {
        case "sales":
            data = await report_service_1.reportService.getSalesReport(shopId, dateRangeResult);
            break;
        case "purchases":
            data = await report_service_1.reportService.getPurchaseReport(shopId, dateRangeResult);
            break;
        case "inventory":
            data = await report_service_1.reportService.getInventoryReport(shopId);
            break;
        case "expenses":
            data = await report_service_1.reportService.getExpenseReport(shopId, dateRangeResult);
            break;
        case "profit":
            data = await report_service_1.reportService.getProfitReport(shopId, dateRangeResult);
            break;
        case "revenue":
            data = await report_service_1.reportService.getRevenueReport(shopId, dateRangeResult);
            break;
    }
    (0, response_1.sendResponse)(res, 200, `${reportType} report fetched successfully`, data);
});
exports.getSalesReportHandler = getReportHandler("sales");
exports.getPurchaseReportHandler = getReportHandler("purchases");
exports.getInventoryReportHandler = getReportHandler("inventory");
exports.getExpenseReportHandler = getReportHandler("expenses");
exports.getProfitReportHandler = getReportHandler("profit");
exports.getRevenueReportHandler = getReportHandler("revenue");
exports.exportReportHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const reportType = req.params.type;
    const format = req.query.format || "csv";
    const dateRange = req.query.dateRange || "thisMonth";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (!VALID_REPORT_TYPES.includes(reportType)) {
        (0, response_1.sendResponse)(res, 400, `Invalid report type. Valid types: ${VALID_REPORT_TYPES.join(", ")}`);
        return;
    }
    if (!VALID_FORMATS.includes(format)) {
        (0, response_1.sendResponse)(res, 400, `Invalid format. Valid formats: ${VALID_FORMATS.join(", ")}`);
        return;
    }
    if (!VALID_DATE_RANGES.includes(dateRange)) {
        (0, response_1.sendResponse)(res, 400, `Invalid date range. Valid ranges: ${VALID_DATE_RANGES.join(", ")}`);
        return;
    }
    const result = await report_service_1.reportService.generateReport(shopId, reportType, format, dateRange, startDate, endDate);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(result.data);
});
//# sourceMappingURL=report.controller.js.map