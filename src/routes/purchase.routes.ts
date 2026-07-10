import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdParamSchema,
  listPurchasesSchema,
} from "../validators/purchase.validator";
import {
  createPurchaseHandler,
  listPurchasesHandler,
  getPurchaseHandler,
  updatePurchaseHandler,
  deletePurchaseHandler,
  getPurchaseStatisticsHandler,
} from "../controllers/purchase.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post(
  "/",
  validateRequest(createPurchaseSchema),
  createPurchaseHandler,
);

router.get(
  "/",
  validateRequest(listPurchasesSchema),
  listPurchasesHandler,
);

router.get("/statistics", getPurchaseStatisticsHandler);

router.get(
  "/:id",
  validateRequest(purchaseIdParamSchema),
  getPurchaseHandler,
);

router.patch(
  "/:id",
  validateRequest(updatePurchaseSchema),
  updatePurchaseHandler,
);

router.delete(
  "/:id",
  validateRequest(purchaseIdParamSchema),
  deletePurchaseHandler,
);

export default router;
