// src/models/AIKnowledge.ts
import { Schema, model, Document, Types } from "mongoose";
import { EmbeddingStatus } from "../enums/index";

export interface IAIKnowledge extends Document {
  shopId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  summary: string;
  embeddingStatus: EmbeddingStatus;
}

const aiKnowledgeSchema = new Schema<IAIKnowledge>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    summary: { type: String, default: "" },
    embeddingStatus: {
      type: String,
      enum: Object.values(EmbeddingStatus),
      default: EmbeddingStatus.PENDING,
    },
  },
  { timestamps: true, versionKey: false },
);

export const AIKnowledge = model<IAIKnowledge>(
  "AIKnowledge",
  aiKnowledgeSchema,
);
