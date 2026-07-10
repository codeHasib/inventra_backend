"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistoryHandler = exports.chatHandler = exports.getExtractedTextHandler = exports.updateKnowledgeHandler = exports.deleteKnowledgeHandler = exports.getKnowledgeHandler = exports.listKnowledgeHandler = exports.uploadKnowledgeHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
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
exports.chatHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const { question } = req.body;
    if (!question || typeof question !== "string" || question.trim().length === 0) {
        (0, response_1.sendResponse)(res, 400, "Question is required");
        return;
    }
    const result = await ai_knowledge_service_1.aiKnowledgeService.chat(shopId, question.trim());
    (0, response_1.sendResponse)(res, 200, "Chat response generated successfully", result);
});
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
//# sourceMappingURL=ai-knowledge.controller.js.map