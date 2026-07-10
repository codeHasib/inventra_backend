import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdParamSchema,
  listSuppliersSchema,
} from "../validators/supplier.validator";
import {
  createSupplierHandler,
  listSuppliersHandler,
  getSupplierHandler,
  updateSupplierHandler,
  deleteSupplierHandler,
} from "../controllers/supplier.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post(
  "/",
  validateRequest(createSupplierSchema),
  createSupplierHandler,
);

router.get(
  "/",
  validateRequest(listSuppliersSchema),
  listSuppliersHandler,
);

router.get(
  "/:id",
  validateRequest(supplierIdParamSchema),
  getSupplierHandler,
);

router.patch(
  "/:id",
  validateRequest(updateSupplierSchema),
  updateSupplierHandler,
);

router.delete(
  "/:id",
  validateRequest(supplierIdParamSchema),
  deleteSupplierHandler,
);

export default router;
