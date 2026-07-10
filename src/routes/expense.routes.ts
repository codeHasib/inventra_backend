import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator";
import {
  createExpenseHandler,
  getExpensesHandler,
  getExpenseByIdHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getExpenseStatisticsHandler,
} from "../controllers/expense.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.get("/statistics", getExpenseStatisticsHandler);

router.post("/", validateRequest(createExpenseSchema), createExpenseHandler);

router.get("/", getExpensesHandler);

router.get("/:id", getExpenseByIdHandler);

router.patch("/:id", validateRequest(updateExpenseSchema), updateExpenseHandler);

router.delete("/:id", deleteExpenseHandler);

export default router;
