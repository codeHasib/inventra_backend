"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const category_validator_1 = require("../validators/category.validator");
const category_controller_1 = require("../controllers/category.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.post("/", (0, validate_middleware_1.validateRequest)(category_validator_1.createCategorySchema), category_controller_1.createCategoryHandler);
router.get("/", category_controller_1.listCategoriesHandler);
router.get("/:id", (0, validate_middleware_1.validateRequest)(category_validator_1.categoryIdParamSchema), category_controller_1.getCategoryHandler);
router.put("/:id", (0, validate_middleware_1.validateRequest)(category_validator_1.updateCategorySchema), category_controller_1.updateCategoryHandler);
router.delete("/:id", (0, validate_middleware_1.validateRequest)(category_validator_1.categoryIdParamSchema), category_controller_1.deleteCategoryHandler);
exports.default = router;
//# sourceMappingURL=category.routes.js.map