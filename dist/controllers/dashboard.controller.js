"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarningsHandler = exports.getTopProductsHandler = exports.getChartsHandler = exports.getInventoryHandler = exports.getSalesHandler = exports.getRevenueHandler = exports.getOverviewHandler = exports.getDashboardStatsHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const dashboard_service_1 = require("../services/dashboard.service");
const logger_1 = require("../utils/logger");
const getDashboardStatsHandler = async (req, res) => {
    try {
        if (!req.user?.shopId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
        }
        const shopId = req.user.shopId;
        const limit = Number(req.query.limit) || 10;
        const [stats, overview, revenue, sales, inventory, charts, topProducts, warnings] = await Promise.all([
            dashboard_service_1.dashboardService.getDashboardStats(shopId),
            dashboard_service_1.dashboardService.getOverview(shopId),
            dashboard_service_1.dashboardService.getRevenue(shopId),
            dashboard_service_1.dashboardService.getSales(shopId),
            dashboard_service_1.dashboardService.getInventory(shopId),
            dashboard_service_1.dashboardService.getCharts(shopId),
            dashboard_service_1.dashboardService.getTopProducts(shopId, limit),
            dashboard_service_1.dashboardService.getWarnings(shopId),
        ]);
        const finalData = {
            stats,
            overview,
            revenueData: revenue,
            salesData: sales,
            inventoryData: inventory,
            chartsData: charts,
            topProducts,
            warnings,
        };
        res.json({ success: true, message: "Dashboard data fetched successfully", data: finalData });
    }
    catch (error) {
        logger_1.logger.error(`Failed to fetch dashboard stats: ${error}`);
        res.status(500).json({ success: false, message: "Server error occurred while fetching dashboard stats." });
    }
};
exports.getDashboardStatsHandler = getDashboardStatsHandler;
exports.getOverviewHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const overview = await dashboard_service_1.dashboardService.getOverview(shopId);
    (0, response_1.sendResponse)(res, 200, "Dashboard overview fetched successfully", overview);
});
exports.getRevenueHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const revenue = await dashboard_service_1.dashboardService.getRevenue(shopId);
    (0, response_1.sendResponse)(res, 200, "Revenue data fetched successfully", revenue);
});
exports.getSalesHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const sales = await dashboard_service_1.dashboardService.getSales(shopId);
    (0, response_1.sendResponse)(res, 200, "Sales data fetched successfully", sales);
});
exports.getInventoryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const inventory = await dashboard_service_1.dashboardService.getInventory(shopId);
    (0, response_1.sendResponse)(res, 200, "Inventory data fetched successfully", inventory);
});
exports.getChartsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const charts = await dashboard_service_1.dashboardService.getCharts(shopId);
    (0, response_1.sendResponse)(res, 200, "Chart data fetched successfully", charts);
});
exports.getTopProductsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const limit = Number(req.query.limit) || 10;
    const topProducts = await dashboard_service_1.dashboardService.getTopProducts(shopId, limit);
    (0, response_1.sendResponse)(res, 200, "Top products data fetched successfully", topProducts);
});
exports.getWarningsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const warnings = await dashboard_service_1.dashboardService.getWarnings(shopId);
    (0, response_1.sendResponse)(res, 200, "Warnings data fetched successfully", warnings);
});
//# sourceMappingURL=dashboard.controller.js.map