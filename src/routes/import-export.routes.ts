import { Router } from "express";
import multer from "multer";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import { importHandler, exportHandler } from "../controllers/import-export.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith(".csv") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel (.xlsx) files are allowed"));
    }
  },
});

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post("/import/:entity", upload.single("file"), importHandler);
router.get("/export/:entity", exportHandler);

export default router;
