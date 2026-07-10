"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shop_routes_1 = __importDefault(require("./shop.routes"));
const category_routes_1 = __importDefault(require("./category.routes"));
const supplier_routes_1 = __importDefault(require("./supplier.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const purchase_routes_1 = __importDefault(require("./purchase.routes"));
const router = (0, express_1.Router)();
router.use("/shops", shop_routes_1.default);
router.use("/categories", category_routes_1.default);
router.use("/suppliers", supplier_routes_1.default);
router.use("/products", product_routes_1.default);
router.use("/purchases", purchase_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map