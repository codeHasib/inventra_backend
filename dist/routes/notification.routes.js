"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
// Queries
router.get("/", notification_controller_1.getNotificationsHandler);
router.get("/unread-count", notification_controller_1.getUnreadCountHandler);
// Mutations
router.patch("/:id/read", notification_controller_1.markAsReadHandler);
router.patch("/read-all", notification_controller_1.markAllAsReadHandler);
router.delete("/:id", notification_controller_1.deleteNotificationHandler);
router.delete("/", notification_controller_1.deleteAllNotificationsHandler);
// Generation triggers
router.post("/generate/inventory", notification_controller_1.generateInventoryAlertsHandler);
router.post("/generate/sales-summary", notification_controller_1.generateMonthlySalesSummaryHandler);
router.post("/generate/profit-summary", notification_controller_1.generateMonthlyProfitSummaryHandler);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map