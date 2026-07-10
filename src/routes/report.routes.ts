import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import {
  getSalesReportHandler,
  getPurchaseReportHandler,
  getInventoryReportHandler,
  getExpenseReportHandler,
  getProfitReportHandler,
  getRevenueReportHandler,
  exportReportHandler,
} from "../controllers/report.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.get("/sales", getSalesReportHandler);
router.get("/purchases", getPurchaseReportHandler);
router.get("/inventory", getInventoryReportHandler);
router.get("/expenses", getExpenseReportHandler);
router.get("/profit", getProfitReportHandler);
router.get("/revenue", getRevenueReportHandler);
router.get("/export/:type", exportReportHandler);

export default router;
