"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.get("/stats", dashboard_controller_1.getDashboardStatsHandler);
router.get("/overview", dashboard_controller_1.getOverviewHandler);
router.get("/revenue", dashboard_controller_1.getRevenueHandler);
router.get("/sales", dashboard_controller_1.getSalesHandler);
router.get("/inventory", dashboard_controller_1.getInventoryHandler);
router.get("/charts", dashboard_controller_1.getChartsHandler);
router.get("/top-products", dashboard_controller_1.getTopProductsHandler);
router.get("/warnings", dashboard_controller_1.getWarningsHandler);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map