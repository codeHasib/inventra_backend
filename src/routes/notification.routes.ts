import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  deleteAllNotificationsHandler,
  generateInventoryAlertsHandler,
  generateMonthlySalesSummaryHandler,
  generateMonthlyProfitSummaryHandler,
} from "../controllers/notification.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

// Queries
router.get("/", getNotificationsHandler);
router.get("/unread-count", getUnreadCountHandler);

// Mutations
router.patch("/:id/read", markAsReadHandler);
router.patch("/read-all", markAllAsReadHandler);
router.delete("/:id", deleteNotificationHandler);
router.delete("/", deleteAllNotificationsHandler);

// Generation triggers
router.post("/generate/inventory", generateInventoryAlertsHandler);
router.post("/generate/sales-summary", generateMonthlySalesSummaryHandler);
router.post("/generate/profit-summary", generateMonthlyProfitSummaryHandler);

export default router;
