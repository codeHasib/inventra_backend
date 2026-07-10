"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const import_export_controller_1 = require("../controllers/import-export.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
        ];
        if (allowed.includes(file.mimetype) ||
            file.originalname.endsWith(".csv") ||
            file.originalname.endsWith(".xlsx") ||
            file.originalname.endsWith(".xls")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only CSV and Excel (.xlsx) files are allowed"));
        }
    },
});
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.post("/import/:entity", upload.single("file"), import_export_controller_1.importHandler);
router.get("/export/:entity", import_export_controller_1.exportHandler);
exports.default = router;
//# sourceMappingURL=import-export.routes.js.map