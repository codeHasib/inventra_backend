import { Router } from "express";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import {
  generateBarcodeHandler,
  setCustomBarcodeHandler,
  getBarcodeSVGHandler,
  generateQRCodeHandler,
  generateBarcodeSheetHandler,
  generateQRSheetHandler,
} from "../controllers/barcode.controller";

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

// Single product barcode
router.post("/generate/:productId", generateBarcodeHandler);
router.patch("/custom/:productId", setCustomBarcodeHandler);

// SVG barcode image (public, needs auth only)
router.get("/svg", getBarcodeSVGHandler);

// QR code for a single product
router.get("/qr/:productId", generateQRCodeHandler);

// Batch PDF sheets
router.post("/sheet", generateBarcodeSheetHandler);
router.post("/qr-sheet", generateQRSheetHandler);

export default router;
