import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator";
import {
  createExpenseHandler,
  getAllExpensesHandler,
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

router.get("/all", getAllExpensesHandler);

router.post("/", validateRequest(createExpenseSchema), createExpenseHandler);

router.get("/", getExpensesHandler);

router.get("/:id", getExpenseByIdHandler);

router.patch("/:id", validateRequest(updateExpenseSchema), updateExpenseHandler);

router.delete("/:id", deleteExpenseHandler);

export default router;
