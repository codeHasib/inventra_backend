import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import * as barcodeService from "../services/barcode.service";

export const generateBarcodeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.productId as string;

    const product = await barcodeService.assignBarcode(shopId, productId);

    sendResponse(res, 200, "Barcode generated successfully", {
      productId: product._id,
      barcode: product.barcode,
    });
  },
);

export const setCustomBarcodeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.productId as string;
    const { barcode } = req.body;

    if (!barcode || typeof barcode !== "string" || barcode.trim().length === 0) {
      sendResponse(res, 400, "Barcode is required");
      return;
    }

    const product = await barcodeService.setCustomBarcode(shopId, productId, barcode.trim());

    sendResponse(res, 200, "Custom barcode set successfully", {
      productId: product._id,
      barcode: product.barcode,
    });
  },
);

export const getBarcodeSVGHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { text } = req.query;
    if (!text || typeof text !== "string") {
      sendResponse(res, 400, "Text query parameter is required");
      return;
    }

    const svg = barcodeService.getBarcodeSVG(text);

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  },
);

export const generateQRCodeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.productId as string;

    const buffer = await barcodeService.generateQRCode(shopId, productId);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  },
);

export const generateBarcodeSheetHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const { productIds, labelsPerRow, showPrice, showName } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      sendResponse(res, 400, "productIds array is required");
      return;
    }

    const buffer = await barcodeService.generateBarcodeSheet(shopId, productIds, {
      labelsPerRow,
      showPrice,
      showName,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=barcode-sheet.pdf");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  },
);

export const generateQRSheetHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const { productIds, labelsPerRow, showName, showPrice } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      sendResponse(res, 400, "productIds array is required");
      return;
    }

    const buffer = await barcodeService.generateQRSheet(shopId, productIds, {
      labelsPerRow,
      showName,
      showPrice,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=qr-sheet.pdf");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  },
);
