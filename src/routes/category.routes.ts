import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "../validators/category.validator";
import {
  createCategoryHandler,
  listCategoriesHandler,
  getCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/category.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post(
  "/",
  validateRequest(createCategorySchema),
  createCategoryHandler,
);

router.get(
  "/",
  listCategoriesHandler,
);

router.get(
  "/:id",
  validateRequest(categoryIdParamSchema),
  getCategoryHandler,
);

router.put(
  "/:id",
  validateRequest(updateCategorySchema),
  updateCategoryHandler,
);

router.delete(
  "/:id",
  validateRequest(categoryIdParamSchema),
  deleteCategoryHandler,
);

export default router;
