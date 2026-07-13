"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const purchase_validator_1 = require("../validators/purchase.validator");
const purchase_controller_1 = require("../controllers/purchase.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.post("/", (0, validate_middleware_1.validateRequest)(purchase_validator_1.createPurchaseSchema), purchase_controller_1.createPurchaseHandler);
router.get("/", (0, validate_middleware_1.validateRequest)(purchase_validator_1.listPurchasesSchema), purchase_controller_1.listPurchasesHandler);
router.get("/all", purchase_controller_1.getAllPurchasesHandler);
router.get("/statistics", purchase_controller_1.getPurchaseStatisticsHandler);
router.get("/:id", (0, validate_middleware_1.validateRequest)(purchase_validator_1.purchaseIdParamSchema), purchase_controller_1.getPurchaseHandler);
router.patch("/:id", (0, validate_middleware_1.validateRequest)(purchase_validator_1.updatePurchaseSchema), purchase_controller_1.updatePurchaseHandler);
router.delete("/:id", (0, validate_middleware_1.validateRequest)(purchase_validator_1.purchaseIdParamSchema), purchase_controller_1.deletePurchaseHandler);
exports.default = router;
//# sourceMappingURL=purchase.routes.js.map