import { Router } from "express";
import { requireAuth, requireOwner, requireOnboarding } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createShopSchema,
  updateShopSchema,
  shopIdParamSchema,
  listShopsSchema,
} from "../validators/shop.validator";
import {
  createShopHandler,
  createFirstShopHandler,
  getShopHandler,
  listShopsHandler,
  updateShopHandler,
  deleteShopHandler,
} from "../controllers/shop.controller";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateRequest(listShopsSchema),
  listShopsHandler,
);

router.get(
  "/:id",
  validateRequest(shopIdParamSchema),
  getShopHandler,
);

router.post(
  "/onboard",
  requireOnboarding,
  validateRequest(createShopSchema),
  createFirstShopHandler,
);

router.post(
  "/",
  requireOwner,
  validateRequest(createShopSchema),
  createShopHandler,
);

router.put(
  "/:id",
  requireOwner,
  validateRequest(updateShopSchema),
  updateShopHandler,
);

router.delete(
  "/:id",
  requireOwner,
  validateRequest(shopIdParamSchema),
  deleteShopHandler,
);

export default router;
