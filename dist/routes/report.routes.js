"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.get("/sales", report_controller_1.getSalesReportHandler);
router.get("/purchases", report_controller_1.getPurchaseReportHandler);
router.get("/inventory", report_controller_1.getInventoryReportHandler);
router.get("/expenses", report_controller_1.getExpenseReportHandler);
router.get("/profit", report_controller_1.getProfitReportHandler);
router.get("/revenue", report_controller_1.getRevenueReportHandler);
router.get("/export/:type", report_controller_1.exportReportHandler);
exports.default = router;
//# sourceMappingURL=report.routes.js.map