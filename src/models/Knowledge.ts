import { Schema, model, Document, Types } from "mongoose";
import { EmbeddingStatus } from "../enums/index";

export interface IKnowledgeDocumentAnalysis {
  summary: string;
  businessInsights: string;
  keywords: string[];
  recommendedActions: string[];
}

export interface IKnowledgeDocument extends Document {
  shopId: Types.ObjectId;
  fileName: string;
  fileType: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  extractedText: string;
  wordCount: number;
  status: EmbeddingStatus;
  analysis: IKnowledgeDocumentAnalysis;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeChunk extends Document {
  shopId: Types.ObjectId;
  documentId: Types.ObjectId;
  content: string;
  chunkIndex: number;
  wordCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatHistory extends Document {
  shopId: Types.ObjectId;
  question: string;
  answer: string;
  sources: {
    documentId: Types.ObjectId;
    fileName: string;
    chunkIndex: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeDocumentAnalysisSchema = new Schema<IKnowledgeDocumentAnalysis>(
  {
    summary: { type: String, default: "" },
    businessInsights: { type: String, default: "" },
    keywords: [{ type: String }],
    recommendedActions: [{ type: String }],
  },
  { _id: false },
);

const knowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
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
      enum: Object.values(EmbeddingStatus),
      default: EmbeddingStatus.PENDING,
    },
    analysis: { type: knowledgeDocumentAnalysisSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

knowledgeDocumentSchema.index({ shopId: 1, isDeleted: 1 });
knowledgeDocumentSchema.index({ shopId: 1, status: 1 });
knowledgeDocumentSchema.index({ shopId: 1, createdAt: -1 });

const knowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeDocument",
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    wordCount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

knowledgeChunkSchema.index({ shopId: 1, documentId: 1 });
knowledgeChunkSchema.index({ shopId: 1, isActive: 1 });

const chatHistorySchema = new Schema<IChatHistory>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    sources: [
      {
        documentId: { type: Schema.Types.ObjectId, ref: "KnowledgeDocument" },
        fileName: { type: String },
        chunkIndex: { type: Number },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

chatHistorySchema.index({ shopId: 1, createdAt: -1 });

export const KnowledgeDocument = model<IKnowledgeDocument>(
  "KnowledgeDocument",
  knowledgeDocumentSchema,
);

export const KnowledgeChunk = model<IKnowledgeChunk>(
  "KnowledgeChunk",
  knowledgeChunkSchema,
);

export const ChatHistory = model<IChatHistory>(
  "ChatHistory",
  chatHistorySchema,
);
