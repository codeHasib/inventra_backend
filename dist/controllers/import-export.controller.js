"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportHandler = exports.importHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const importExportService = __importStar(require("../services/import-export.service"));
const VALID_ENTITIES = ["products", "categories", "suppliers"];
const VALID_FORMATS = ["csv", "excel", "pdf"];
exports.importHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const entityType = req.params.entity;
    if (!VALID_ENTITIES.includes(entityType)) {
        (0, response_1.sendResponse)(res, 400, `Invalid entity type. Valid: ${VALID_ENTITIES.join(", ")}`);
        return;
    }
    if (!req.file) {
        (0, response_1.sendResponse)(res, 400, "File is required. Upload a CSV or Excel (.xlsx) file.");
        return;
    }
    const summary = await importExportService.parseAndImport(shopId, entityType, req.file.buffer, req.file.originalname);
    (0, response_1.sendResponse)(res, 200, "Import completed", summary);
});
exports.exportHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const entityType = req.params.entity;
    const format = req.query.format || "csv";
    if (!VALID_ENTITIES.includes(entityType)) {
        (0, response_1.sendResponse)(res, 400, `Invalid entity type. Valid: ${VALID_ENTITIES.join(", ")}`);
        return;
    }
    if (!VALID_FORMATS.includes(format)) {
        (0, response_1.sendResponse)(res, 400, `Invalid format. Valid: ${VALID_FORMATS.join(", ")}`);
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
});
//# sourceMappingURL=import-export.controller.js.map