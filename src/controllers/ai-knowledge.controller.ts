import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { aiKnowledgeService } from "../services/ai-knowledge.service";

export const uploadKnowledgeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;

    if (!req.file) {
      sendResponse(res, 400, "No file uploaded");
      return;
    }

    const document = await aiKnowledgeService.uploadKnowledge(shopId, req.file);
    sendResponse(res, 201, "Knowledge document uploaded successfully", document);
  },
);

export const listKnowledgeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const fileType = req.query.fileType as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await aiKnowledgeService.getKnowledgeList(shopId, {
      page,
      limit,
      search,
      fileType,
      status,
    });

    sendResponse(res, 200, "Knowledge documents fetched successfully", result);
  },
);

export const getKnowledgeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const documentId = req.params.id as string;

    const result = await aiKnowledgeService.getKnowledgeById(shopId, documentId);
    sendResponse(res, 200, "Knowledge document fetched successfully", result);
  },
);

export const deleteKnowledgeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const documentId = req.params.id as string;

    await aiKnowledgeService.deleteKnowledge(shopId, documentId);
    sendResponse(res, 200, "Knowledge document deleted successfully");
  },
);

export const updateKnowledgeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const documentId = req.params.id as string;
    const { fileName } = req.body;

    const document = await aiKnowledgeService.updateKnowledge(shopId, documentId, {
      fileName,
    });

    sendResponse(res, 200, "Knowledge document updated successfully", document);
  },
);

export const getExtractedTextHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const documentId = req.params.id as string;

    const result = await aiKnowledgeService.getExtractedText(shopId, documentId);
    sendResponse(res, 200, "Extracted text fetched successfully", result);
  },
);

export const chatHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      sendResponse(res, 400, "Question is required");
      return;
    }

    const result = await aiKnowledgeService.chat(shopId, question.trim());
    sendResponse(res, 200, "Chat response generated successfully", result);
  },
);

export const getChatHistoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await aiKnowledgeService.getChatHistory(shopId, {
      page,
      limit,
    });

    sendResponse(res, 200, "Chat history fetched successfully", result);
  },
);
