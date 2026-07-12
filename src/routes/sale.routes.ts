import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createSaleSchema,
  updateSaleSchema,
  saleIdParamSchema,
  listSalesSchema,
  saleStatisticsSchema,
  topProductsSchema,
} from "../validators/sale.validator";
import {
  createSaleHandler,
  listSalesHandler,
  getAllSalesHandler,
  getSaleHandler,
  updateSaleHandler,
  deleteSaleHandler,
  refundSaleHandler,
  getSaleStatisticsHandler,
  getTopProductsHandler,
} from "../controllers/sale.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post(
  "/",
  validateRequest(createSaleSchema),
  createSaleHandler,
);

router.get(
  "/",
  validateRequest(listSalesSchema),
  listSalesHandler,
);

router.get("/all", getAllSalesHandler);

router.get(
  "/statistics",
  validateRequest(saleStatisticsSchema),
  getSaleStatisticsHandler,
);

router.get(
  "/top-products",
  validateRequest(topProductsSchema),
  getTopProductsHandler,
);

router.get(
  "/:id",
  validateRequest(saleIdParamSchema),
  getSaleHandler,
);

router.patch(
  "/:id",
  validateRequest(updateSaleSchema),
  updateSaleHandler,
);

router.patch(
  "/:id/refund",
  validateRequest(saleIdParamSchema),
  refundSaleHandler,
);

router.delete(
  "/:id",
  validateRequest(saleIdParamSchema),
  deleteSaleHandler,
);

export default router;
