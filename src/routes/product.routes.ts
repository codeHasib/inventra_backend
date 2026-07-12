import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  updateStockSchema,
  listProductsSchema,
} from "../validators/product.validator";
import {
  createProductHandler,
  listProductsHandler,
  getAllProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler,
  updateStockHandler,
  getProductStatisticsHandler,
  getLowStockProductsHandler,
  getOutOfStockProductsHandler,
} from "../controllers/product.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post(
  "/",
  validateRequest(createProductSchema),
  createProductHandler,
);

router.get("/all", getAllProductsHandler);

router.get(
  "/",
  validateRequest(listProductsSchema),
  listProductsHandler,
);

router.get("/statistics", getProductStatisticsHandler);

router.get("/low-stock", getLowStockProductsHandler);

router.get("/out-of-stock", getOutOfStockProductsHandler);

router.get(
  "/:id",
  validateRequest(productIdParamSchema),
  getProductHandler,
);

router.patch(
  "/:id",
  validateRequest(updateProductSchema),
  updateProductHandler,
);

router.delete(
  "/:id",
  validateRequest(productIdParamSchema),
  deleteProductHandler,
);

router.patch(
  "/:id/stock",
  validateRequest(updateStockSchema),
  updateStockHandler,
);

export default router;
