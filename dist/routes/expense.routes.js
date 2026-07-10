"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const expense_validator_1 = require("../validators/expense.validator");
const expense_controller_1 = require("../controllers/expense.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.get("/statistics", expense_controller_1.getExpenseStatisticsHandler);
router.post("/", (0, validate_middleware_1.validateRequest)(expense_validator_1.createExpenseSchema), expense_controller_1.createExpenseHandler);
router.get("/", expense_controller_1.getExpensesHandler);
router.get("/:id", expense_controller_1.getExpenseByIdHandler);
router.patch("/:id", (0, validate_middleware_1.validateRequest)(expense_validator_1.updateExpenseSchema), expense_controller_1.updateExpenseHandler);
router.delete("/:id", expense_controller_1.deleteExpenseHandler);
exports.default = router;
//# sourceMappingURL=expense.routes.js.map