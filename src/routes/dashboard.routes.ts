import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import {
  getDashboardStatsHandler,
  getOverviewHandler,
  getRevenueHandler,
  getSalesHandler,
  getInventoryHandler,
  getChartsHandler,
  getTopProductsHandler,
  getWarningsHandler,
} from "../controllers/dashboard.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.get("/stats", getDashboardStatsHandler);
router.get("/overview", getOverviewHandler);
router.get("/revenue", getRevenueHandler);
router.get("/sales", getSalesHandler);
router.get("/inventory", getInventoryHandler);
router.get("/charts", getChartsHandler);
router.get("/top-products", getTopProductsHandler);
router.get("/warnings", getWarningsHandler);

export default router;
