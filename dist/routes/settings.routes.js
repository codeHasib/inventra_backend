"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.get("/profile", settings_controller_1.getProfileHandler);
router.patch("/profile", settings_controller_1.updateProfileHandler);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map