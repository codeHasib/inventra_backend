import { Router } from "express";
import multer from "multer";
import { requireAuth, requireShopAccess } from "../middlewares/auth.middleware";
import {
  uploadKnowledgeHandler,
  listKnowledgeHandler,
  getKnowledgeHandler,
  deleteKnowledgeHandler,
  updateKnowledgeHandler,
  getExtractedTextHandler,
  chatHandler,
  getChatHistoryHandler,
} from "../controllers/ai-knowledge.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: PDF, DOCX, TXT, CSV"));
    }
  },
});

const router = Router();

router.use(requireAuth);
router.use(requireShopAccess);

router.post(
  "/upload",
  upload.single("file"),
  uploadKnowledgeHandler,
);

router.get("/", listKnowledgeHandler);

router.get("/chat/history", getChatHistoryHandler);

router.post("/chat", chatHandler);

router.get("/:id", getKnowledgeHandler);

router.get("/:id/text", getExtractedTextHandler);

router.patch("/:id", updateKnowledgeHandler);

router.delete("/:id", deleteKnowledgeHandler);

export default router;
