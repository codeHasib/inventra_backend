"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const supplier_validator_1 = require("../validators/supplier.validator");
const supplier_controller_1 = require("../controllers/supplier.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.post("/", (0, validate_middleware_1.validateRequest)(supplier_validator_1.createSupplierSchema), supplier_controller_1.createSupplierHandler);
router.get("/", (0, validate_middleware_1.validateRequest)(supplier_validator_1.listSuppliersSchema), supplier_controller_1.listSuppliersHandler);
router.get("/:id", (0, validate_middleware_1.validateRequest)(supplier_validator_1.supplierIdParamSchema), supplier_controller_1.getSupplierHandler);
router.patch("/:id", (0, validate_middleware_1.validateRequest)(supplier_validator_1.updateSupplierSchema), supplier_controller_1.updateSupplierHandler);
router.delete("/:id", (0, validate_middleware_1.validateRequest)(supplier_validator_1.supplierIdParamSchema), supplier_controller_1.deleteSupplierHandler);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map