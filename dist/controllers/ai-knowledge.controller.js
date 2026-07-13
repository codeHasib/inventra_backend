"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportChatPdfHandler = exports.getChatHistoryHandler = exports.chatHandler = exports.getExtractedTextHandler = exports.updateKnowledgeHandler = exports.deleteKnowledgeHandler = exports.getKnowledgeHandler = exports.listKnowledgeHandler = exports.uploadKnowledgeHandler = void 0;
const mongoose_1 = require("mongoose");
const pdfkit_1 = __importDefault(require("pdfkit"));
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const ai_knowledge_service_1 = require("../services/ai-knowledge.service");
exports.uploadKnowledgeHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    if (!req.file) {
        (0, response_1.sendResponse)(res, 400, "No file uploaded");
        return;
    }
    const document = await ai_knowledge_service_1.aiKnowledgeService.uploadKnowledge(shopId, req.file);
    (0, response_1.sendResponse)(res, 201, "Knowledge document uploaded successfully", document);
});
exports.listKnowledgeHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const fileType = req.query.fileType;
    const status = req.query.status;
    const result = await ai_knowledge_service_1.aiKnowledgeService.getKnowledgeList(shopId, {
        page,
        limit,
        search,
        fileType,
        status,
    });
    (0, response_1.sendResponse)(res, 200, "Knowledge documents fetched successfully", result);
});
exports.getKnowledgeHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const documentId = req.params.id;
    const result = await ai_knowledge_service_1.aiKnowledgeService.getKnowledgeById(shopId, documentId);
    (0, response_1.sendResponse)(res, 200, "Knowledge document fetched successfully", result);
});
exports.deleteKnowledgeHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const documentId = req.params.id;
    await ai_knowledge_service_1.aiKnowledgeService.deleteKnowledge(shopId, documentId);
    (0, response_1.sendResponse)(res, 200, "Knowledge document deleted successfully");
});
exports.updateKnowledgeHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const documentId = req.params.id;
    const { fileName } = req.body;
    const document = await ai_knowledge_service_1.aiKnowledgeService.updateKnowledge(shopId, documentId, {
        fileName,
    });
    (0, response_1.sendResponse)(res, 200, "Knowledge document updated successfully", document);
});
exports.getExtractedTextHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const documentId = req.params.id;
    const result = await ai_knowledge_service_1.aiKnowledgeService.getExtractedText(shopId, documentId);
    (0, response_1.sendResponse)(res, 200, "Extracted text fetched successfully", result);
});
const chatHandler = async (req, res) => {
    try {
        const shopId = req.user?.shopId;
        if (!shopId) {
            res.status(401).json({ error: "Unauthorized — shopId not found on session" });
            return;
        }
        const { question } = req.body;
        if (!question || typeof question !== "string" || question.trim().length === 0) {
            res.status(400).json({ error: "Question is required" });
            return;
        }
        const result = await ai_knowledge_service_1.aiKnowledgeService.chat(shopId, question.trim());
        if (!result || !result.report) {
            throw new Error("AI returned an empty result — no report generated");
        }
        res.status(200).json({
            success: true,
            message: "Chat response generated successfully",
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error(`Chat controller failed: ${error}`);
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: "Failed to process AI response",
            details: message,
        });
    }
};
exports.chatHandler = chatHandler;
exports.getChatHistoryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await ai_knowledge_service_1.aiKnowledgeService.getChatHistory(shopId, {
        page,
        limit,
    });
    (0, response_1.sendResponse)(res, 200, "Chat history fetched successfully", result);
});
const exportChatPdfHandler = async (req, res) => {
    try {
        const shopId = req.user?.shopId;
        if (!shopId) {
            res.status(401).json({ error: "Unauthorized — shopId not found on session" });
            return;
        }
        const chatId = req.params.chatId;
        if (!chatId || !mongoose_1.Types.ObjectId.isValid(chatId)) {
            res.status(400).json({ error: "Invalid chatId — must be a valid MongoDB ObjectId" });
            return;
        }
        const chat = await ai_knowledge_service_1.aiKnowledgeService.getChatById(shopId, chatId);
        let report;
        try {
            report = JSON.parse(chat.answer);
        }
        catch {
            report = { title: "Chat Report", summary: chat.answer, sections: [], recommendations: [] };
        }
        const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="report-${chatId}.pdf"`);
        doc.pipe(res);
        doc.fontSize(22).font("Helvetica-Bold").text(report.title || "Analysis Report", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#666666").text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, { align: "center" });
        doc.moveDown(1);
        doc.fillColor("#000000");
        doc.fontSize(14).font("Helvetica-Bold").text("Summary");
        doc.moveDown(0.3);
        doc.fontSize(11).font("Helvetica").text(report.summary || "No summary available.", {
            lineGap: 4,
        });
        doc.moveDown(1);
        if (report.sections.length > 0) {
            doc.fontSize(14).font("Helvetica-Bold").text("Sections");
            doc.moveDown(0.3);
            for (const section of report.sections) {
                const priorityColor = section.priority === "High" ? "#DC2626" :
                    section.priority === "Medium" ? "#D97706" : "#16A34A";
                doc.fontSize(12).font("Helvetica-Bold").text(section.header || "Untitled Section");
                doc.fontSize(9).font("Helvetica-Bold").fillColor(priorityColor).text(`Priority: ${section.priority}`);
                doc.fillColor("#000000");
                doc.moveDown(0.2);
                doc.fontSize(11).font("Helvetica").text(section.content || "", { lineGap: 3 });
                doc.moveDown(0.8);
            }
        }
        if (report.recommendations.length > 0) {
            doc.fontSize(14).font("Helvetica-Bold").text("Recommendations");
            doc.moveDown(0.3);
            for (let i = 0; i < report.recommendations.length; i++) {
                doc.fontSize(11).font("Helvetica").text(`${i + 1}. ${report.recommendations[i]}`, {
                    lineGap: 2,
                });
            }
            doc.moveDown(1);
        }
        if (chat.question) {
            doc.moveDown(1);
            doc.fontSize(9).font("Helvetica").fillColor("#999999").text(`Original question: ${chat.question}`);
        }
        doc.end();
    }
    catch (error) {
        logger_1.logger.error(`PDF export failed: ${error}`);
        if (!res.headersSent) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({ error: "Failed to generate PDF", details: message });
        }
    }
};
exports.exportChatPdfHandler = exportChatPdfHandler;
//# sourceMappingURL=ai-knowledge.controller.js.map