"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const shop_validator_1 = require("../validators/shop.validator");
const shop_controller_1 = require("../controllers/shop.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get("/", (0, validate_middleware_1.validateRequest)(shop_validator_1.listShopsSchema), shop_controller_1.listShopsHandler);
router.get("/:id", (0, validate_middleware_1.validateRequest)(shop_validator_1.shopIdParamSchema), shop_controller_1.getShopHandler);
router.post("/onboard", auth_middleware_1.requireOnboarding, (0, validate_middleware_1.validateRequest)(shop_validator_1.createShopSchema), shop_controller_1.createFirstShopHandler);
router.post("/", auth_middleware_1.requireOwner, (0, validate_middleware_1.validateRequest)(shop_validator_1.createShopSchema), shop_controller_1.createShopHandler);
router.put("/:id", auth_middleware_1.requireOwner, (0, validate_middleware_1.validateRequest)(shop_validator_1.updateShopSchema), shop_controller_1.updateShopHandler);
router.delete("/:id", auth_middleware_1.requireOwner, (0, validate_middleware_1.validateRequest)(shop_validator_1.shopIdParamSchema), shop_controller_1.deleteShopHandler);
exports.default = router;
//# sourceMappingURL=shop.routes.js.map