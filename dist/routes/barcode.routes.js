"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const barcode_controller_1 = require("../controllers/barcode.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
// Single product barcode
router.post("/generate/:productId", barcode_controller_1.generateBarcodeHandler);
router.patch("/custom/:productId", barcode_controller_1.setCustomBarcodeHandler);
// SVG barcode image (public, needs auth only)
router.get("/svg", barcode_controller_1.getBarcodeSVGHandler);
// QR code for a single product
router.get("/qr/:productId", barcode_controller_1.generateQRCodeHandler);
// Batch PDF sheets
router.post("/sheet", barcode_controller_1.generateBarcodeSheetHandler);
router.post("/qr-sheet", barcode_controller_1.generateQRSheetHandler);
exports.default = router;
//# sourceMappingURL=barcode.routes.js.map