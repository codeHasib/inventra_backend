"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistory = exports.KnowledgeChunk = exports.KnowledgeDocument = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../enums/index");
const knowledgeDocumentAnalysisSchema = new mongoose_1.Schema({
    summary: { type: String, default: "" },
    keyPoints: [{ type: String }],
    recommendations: [{ type: String }],
    rawAnalysis: { type: String, default: "" },
}, { _id: false });
const knowledgeDocumentSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    fileName: { type: String, required: true, trim: true },
    fileType: {
        type: String,
        required: true,
        enum: ["pdf", "docx", "txt", "csv"],
    },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    extractedText: { type: String, default: "" },
    wordCount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: Object.values(index_1.EmbeddingStatus),
        default: index_1.EmbeddingStatus.PENDING,
    },
    analysis: { type: knowledgeDocumentAnalysisSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
knowledgeDocumentSchema.index({ shopId: 1, isDeleted: 1 });
knowledgeDocumentSchema.index({ shopId: 1, status: 1 });
knowledgeDocumentSchema.index({ shopId: 1, createdAt: -1 });
const knowledgeChunkSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    documentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "KnowledgeDocument",
        required: true,
        index: true,
    },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    wordCount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });
knowledgeChunkSchema.index({ shopId: 1, documentId: 1 });
knowledgeChunkSchema.index({ shopId: 1, isActive: 1 });
const chatHistorySchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    sources: [
        {
            documentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "KnowledgeDocument" },
            fileName: { type: String },
            chunkIndex: { type: Number },
        },
    ],
}, { timestamps: true, versionKey: false });
chatHistorySchema.index({ shopId: 1, createdAt: -1 });
exports.KnowledgeDocument = (0, mongoose_1.model)("KnowledgeDocument", knowledgeDocumentSchema);
exports.KnowledgeChunk = (0, mongoose_1.model)("KnowledgeChunk", knowledgeChunkSchema);
exports.ChatHistory = (0, mongoose_1.model)("ChatHistory", chatHistorySchema);
//# sourceMappingURL=Knowledge.js.map