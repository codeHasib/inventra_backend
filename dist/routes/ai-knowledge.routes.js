"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const ai_knowledge_controller_1 = require("../controllers/ai-knowledge.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error("Unsupported file type. Allowed: PDF, DOCX, TXT, CSV"));
        }
    },
});
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireShopAccess);
router.post("/upload", upload.single("file"), ai_knowledge_controller_1.uploadKnowledgeHandler);
router.get("/", ai_knowledge_controller_1.listKnowledgeHandler);
router.get("/chat/history", ai_knowledge_controller_1.getChatHistoryHandler);
router.get("/chat/export/:chatId", ai_knowledge_controller_1.exportChatPdfHandler);
router.post("/chat", ai_knowledge_controller_1.chatHandler);
router.get("/:id", ai_knowledge_controller_1.getKnowledgeHandler);
router.get("/:id/text", ai_knowledge_controller_1.getExtractedTextHandler);
router.patch("/:id", ai_knowledge_controller_1.updateKnowledgeHandler);
router.delete("/:id", ai_knowledge_controller_1.deleteKnowledgeHandler);
exports.default = router;
//# sourceMappingURL=ai-knowledge.routes.js.map