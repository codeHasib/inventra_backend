import { Types } from "mongoose";
import mammoth from "mammoth";
import { v2 as cloudinary } from "cloudinary";
import {
  KnowledgeDocument,
  KnowledgeChunk,
  ChatHistory,
  IKnowledgeDocument,
  IKnowledgeChunk,
  IChatHistory,
} from "../models/Knowledge";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { EmbeddingStatus } from "../enums/index";

const GEMINI_MODEL = "gemini-2.0-flash";

interface PaginationResult {
  documents: IKnowledgeDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
};

const extractTextFromDocx = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

const extractTextFromTxt = (buffer: Buffer): string => {
  return buffer.toString("utf-8");
};

const extractTextFromCsv = (buffer: Buffer): string => {
  return buffer.toString("utf-8");
};

const extractText = async (
  buffer: Buffer,
  fileType: string,
): Promise<string> => {
  switch (fileType) {
    case "pdf":
      return extractTextFromPdf(buffer);
    case "docx":
      return extractTextFromDocx(buffer);
    case "txt":
      return extractTextFromTxt(buffer);
    case "csv":
      return extractTextFromCsv(buffer);
    default:
      throw new AppError(
        `Unsupported file type: ${fileType}`,
        HTTP_STATUS.BAD_REQUEST,
      );
  }
};

const normalizeText = (text: string): string => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const chunkText = (text: string, targetWords = 650): string[] => {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    let end = Math.min(start + targetWords, words.length);
    const chunkWords = words.slice(start, end);
    let chunkText = chunkWords.join(" ");

    if (end < words.length) {
      const lastPeriod = chunkText.lastIndexOf(".");
      const lastNewline = chunkText.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > targetWords * 0.3) {
        chunkText = chunkText.substring(0, breakPoint + 1);
        end = start + chunkText.split(/\s+/).length;
      }
    }

    chunks.push(chunkText.trim());
    start = end;
  }

  return chunks.filter((c) => c.split(/\s+/).length >= 10);
};

const analyzeWithGemini = async (
  text: string,
): Promise<{
  summary: string;
  businessInsights: string;
  keywords: string[];
  recommendedActions: string[];
}> => {
  const { GoogleGenAI } = await import("@google/genai");
  const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
  });

  const truncatedText = text.substring(0, 8000);

  const prompt = `Analyze the following business document and provide:
1. A concise summary (2-3 paragraphs)
2. Key business insights (bullet points)
3. Relevant keywords (array of strings, max 15)
4. Recommended actions for the business owner (array of strings, max 10)

Document:
${truncatedText}

Respond in JSON format:
{
  "summary": "...",
  "businessInsights": "...",
  "keywords": ["..."],
  "recommendedActions": ["..."]
}`;

  try {
    const response = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      return {
        summary: "",
        businessInsights: "",
        keywords: [],
        recommendedActions: [],
      };
    }

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: textResponse,
        businessInsights: "",
        keywords: [],
        recommendedActions: [],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || "",
      businessInsights: parsed.businessInsights || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions
        : [],
    };
  } catch {
    return {
      summary: "",
      businessInsights: "",
      keywords: [],
      recommendedActions: [],
    };
  }
};

const uploadToCloudinary = async (
  buffer: Buffer,
  fileName: string,
  fileType: string,
): Promise<{ url: string; publicId: string }> => {
  const folder = `inventraai/knowledge`;

  return new Promise((resolve, reject) => {
    const mimeTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      csv: "text/csv",
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        public_id: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9]/g, "_")}`,
        format: fileType,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new AppError("Cloudinary upload failed", 500));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
};

const processDocument = async (
  shopId: string,
  documentId: string,
  buffer: Buffer,
  fileType: string,
): Promise<void> => {
  try {
    await KnowledgeDocument.findOneAndUpdate(
      { _id: documentId, shopId },
      { $set: { status: EmbeddingStatus.PROCESSING } },
    );

    const rawText = await extractText(buffer, fileType);
    const normalizedText = normalizeText(rawText);
    const wordCount = normalizedText.split(/\s+/).filter((w) => w.length > 0).length;

    await KnowledgeDocument.findOneAndUpdate(
      { _id: documentId, shopId },
      { $set: { extractedText: normalizedText, wordCount } },
    );

    const chunks = chunkText(normalizedText);
    const chunkDocs = chunks.map((content, index) => ({
      shopId: new Types.ObjectId(shopId),
      documentId: new Types.ObjectId(documentId),
      content,
      chunkIndex: index,
      wordCount: content.split(/\s+/).filter((w) => w.length > 0).length,
      isActive: true,
    }));

    if (chunkDocs.length > 0) {
      await KnowledgeChunk.insertMany(chunkDocs);
    }

    const analysis = await analyzeWithGemini(normalizedText);

    await KnowledgeDocument.findOneAndUpdate(
      { _id: documentId, shopId },
      {
        $set: {
          status: EmbeddingStatus.COMPLETED,
          analysis,
        },
      },
    );
  } catch {
    await KnowledgeDocument.findOneAndUpdate(
      { _id: documentId, shopId },
      { $set: { status: EmbeddingStatus.FAILED } },
    );
  }
};

const uploadKnowledge = async (
  shopId: string,
  file: Express.Multer.File,
): Promise<IKnowledgeDocument> => {
  const allowedTypes = ["pdf", "docx", "txt", "csv"];
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "";

  if (!allowedTypes.includes(ext)) {
    throw new AppError(
      `Unsupported file type. Allowed: ${allowedTypes.join(", ")}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const { url, publicId } = await uploadToCloudinary(
    file.buffer,
    file.originalname,
    ext,
  );

  const document = await KnowledgeDocument.create({
    shopId: new Types.ObjectId(shopId),
    fileName: file.originalname,
    fileType: ext,
    cloudinaryUrl: url,
    cloudinaryPublicId: publicId,
    status: EmbeddingStatus.PENDING,
  });

  processDocument(shopId, document._id.toString(), file.buffer, ext).catch(
    () => {},
  );

  return document;
};

const getKnowledgeList = async (
  shopId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    fileType?: string;
    status?: string;
  },
): Promise<PaginationResult> => {
  const { page, limit, search, fileType, status } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { shopId, isDeleted: false };

  if (search) {
    filter.$or = [
      { fileName: { $regex: search, $options: "i" } },
      { "analysis.keywords": { $regex: search, $options: "i" } },
    ];
  }

  if (fileType) {
    filter.fileType = fileType;
  }

  if (status) {
    filter.status = status;
  }

  const [documents, total] = await Promise.all([
    KnowledgeDocument.find(filter)
      .select("-extractedText")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    KnowledgeDocument.countDocuments(filter),
  ]);

  return {
    documents,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getKnowledgeById = async (
  shopId: string,
  documentId: string,
): Promise<{ document: IKnowledgeDocument; chunks: IKnowledgeChunk[] }> => {
  const document = await KnowledgeDocument.findOne({
    _id: documentId,
    shopId,
    isDeleted: false,
  });

  if (!document) {
    throw new AppError("Knowledge document not found", HTTP_STATUS.NOT_FOUND);
  }

  const chunks = await KnowledgeChunk.find({
    documentId: document._id,
    shopId,
    isActive: true,
  })
    .sort({ chunkIndex: 1 })
    .select("-__v");

  return { document, chunks };
};

const deleteKnowledge = async (
  shopId: string,
  documentId: string,
): Promise<void> => {
  const document = await KnowledgeDocument.findOne({
    _id: documentId,
    shopId,
    isDeleted: false,
  });

  if (!document) {
    throw new AppError("Knowledge document not found", HTTP_STATUS.NOT_FOUND);
  }

  try {
    await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
      resource_type: "raw",
    });
  } catch {
    // Continue even if Cloudinary deletion fails
  }

  await KnowledgeDocument.findOneAndUpdate(
    { _id: documentId, shopId },
    { $set: { isDeleted: true } },
  );

  await KnowledgeChunk.updateMany(
    { documentId: document._id, shopId },
    { $set: { isActive: false } },
  );
};

const updateKnowledge = async (
  shopId: string,
  documentId: string,
  data: { fileName?: string },
): Promise<IKnowledgeDocument> => {
  const document = await KnowledgeDocument.findOne({
    _id: documentId,
    shopId,
    isDeleted: false,
  });

  if (!document) {
    throw new AppError("Knowledge document not found", HTTP_STATUS.NOT_FOUND);
  }

  const updateFields: Record<string, unknown> = {};
  if (data.fileName !== undefined) updateFields.fileName = data.fileName;

  const updated = await KnowledgeDocument.findOneAndUpdate(
    { _id: documentId, shopId },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw new AppError("Knowledge document not found", HTTP_STATUS.NOT_FOUND);
  }

  return updated;
};

const getExtractedText = async (
  shopId: string,
  documentId: string,
): Promise<{ document: IKnowledgeDocument; extractedText: string }> => {
  const document = await KnowledgeDocument.findOne({
    _id: documentId,
    shopId,
    isDeleted: false,
  });

  if (!document) {
    throw new AppError("Knowledge document not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    document,
    extractedText: document.extractedText,
  };
};

const searchRelevantChunks = async (
  shopId: string,
  query: string,
  limit: number,
): Promise<IKnowledgeChunk[]> => {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (keywords.length === 0) {
    return KnowledgeChunk.find({
      shopId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("documentId", "fileName fileType");
  }

  const regexPattern = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

  const chunks = await KnowledgeChunk.find({
    shopId,
    isActive: true,
    content: { $regex: regexPattern, $options: "i" },
  })
    .limit(limit * 2)
    .populate("documentId", "fileName fileType");

  const scored = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      const matches = contentLower.split(keyword).length - 1;
      score += matches;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.chunk);
};

const chat = async (
  shopId: string,
  question: string,
): Promise<{
  answer: string;
  sources: { documentId: string; fileName: string; chunkIndex: number }[];
}> => {
  const relevantChunks = await searchRelevantChunks(shopId, question, 5);

  if (relevantChunks.length === 0) {
    const answer =
      "I couldn't find this information in your business knowledge. Please upload relevant documents first.";

    await ChatHistory.create({
      shopId: new Types.ObjectId(shopId),
      question,
      answer,
      sources: [],
    });

    return { answer, sources: [] };
  }

  const context = relevantChunks
    .map((chunk, i) => {
      const doc = chunk.documentId as unknown as { fileName: string };
      return `[Source ${i + 1}: ${doc?.fileName || "Unknown"} - Chunk ${chunk.chunkIndex}]\n${chunk.content}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are a helpful business assistant for an inventory management system. Answer the user's question based ONLY on the provided business knowledge below. If the answer cannot be found in the provided context, say "I couldn't find this information in your business knowledge."

Business Knowledge Context:
${context}

User Question: ${question}

Provide a clear, concise, and helpful answer based on the business knowledge above. If you reference specific information, mention which document it comes from.`;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const genai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });

    const response = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1500,
      },
    });

    const answer = response.text || "I couldn't generate a response.";

    const sources = relevantChunks.map((chunk) => {
      const doc = chunk.documentId as unknown as { _id: Types.ObjectId; fileName: string };
      return {
        documentId: doc?._id?.toString() || "",
        fileName: doc?.fileName || "Unknown",
        chunkIndex: chunk.chunkIndex,
      };
    });

    await ChatHistory.create({
      shopId: new Types.ObjectId(shopId),
      question,
      answer,
      sources,
    });

    return { answer, sources };
  } catch {
    const answer =
      "I encountered an error processing your question. Please try again.";

    await ChatHistory.create({
      shopId: new Types.ObjectId(shopId),
      question,
      answer,
      sources: [],
    });

    return { answer, sources: [] };
  }
};

const getChatHistory = async (
  shopId: string,
  options: { page: number; limit: number },
): Promise<{ chats: IChatHistory[]; total: number; page: number; limit: number; totalPages: number }> => {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const filter = { shopId };

  const [chats, total] = await Promise.all([
    ChatHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatHistory.countDocuments(filter),
  ]);

  return {
    chats,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const aiKnowledgeService = {
  uploadKnowledge,
  getKnowledgeList,
  getKnowledgeById,
  deleteKnowledge,
  updateKnowledge,
  getExtractedText,
  chat,
  getChatHistory,
};
