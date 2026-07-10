import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import * as importExportService from "../services/import-export.service";
import { EntityType, ExportFormat } from "../services/import-export.service";

const VALID_ENTITIES: EntityType[] = ["products", "categories", "suppliers"];
const VALID_FORMATS: ExportFormat[] = ["csv", "excel", "pdf"];

export const importHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const entityType = req.params.entity as EntityType;

    if (!VALID_ENTITIES.includes(entityType)) {
      sendResponse(res, 400, `Invalid entity type. Valid: ${VALID_ENTITIES.join(", ")}`);
      return;
    }

    if (!req.file) {
      sendResponse(res, 400, "File is required. Upload a CSV or Excel (.xlsx) file.");
      return;
    }

    const summary = await importExportService.parseAndImport(
      shopId,
      entityType,
      req.file.buffer,
      req.file.originalname,
    );

    sendResponse(res, 200, "Import completed", summary);
  },
);

export const exportHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const entityType = req.params.entity as EntityType;
    const format = (req.query.format as ExportFormat) || "csv";

    if (!VALID_ENTITIES.includes(entityType)) {
      sendResponse(res, 400, `Invalid entity type. Valid: ${VALID_ENTITIES.join(", ")}`);
      return;
    }
    if (!VALID_FORMATS.includes(format)) {
      sendResponse(res, 400, `Invalid format. Valid: ${VALID_FORMATS.join(", ")}`);
      return;
    }

    if (format === "pdf") {
      const result = await importExportService.exportDataPDF(shopId, entityType);
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      res.send(result.data);
      return;
    }

    const result = await importExportService.exportData(shopId, entityType, format);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(result.data);
  },
);
