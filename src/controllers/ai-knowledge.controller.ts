import { Request, Response } from "express";
import { Types } from "mongoose";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { logger } from "../utils/logger";
import { aiKnowledgeService, BusinessReport } from "../services/ai-knowledge.service";

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

export const chatHandler = async (req: Request, res: Response) => {
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

    const result = await aiKnowledgeService.chat(shopId, question.trim());

    if (!result || !result.report) {
      throw new Error("AI returned an empty result — no report generated");
    }

    res.status(200).json({
      success: true,
      message: "Chat response generated successfully",
      data: result,
    });
  } catch (error) {
    logger.error(`Chat controller failed: ${error}`);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: "Failed to process AI response",
      details: message,
    });
  }
};

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

export const exportChatPdfHandler = async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(401).json({ error: "Unauthorized — shopId not found on session" });
      return;
    }

    const chatId = req.params.chatId as string;
    if (!chatId || !Types.ObjectId.isValid(chatId)) {
      res.status(400).json({ error: "Invalid chatId — must be a valid MongoDB ObjectId" });
      return;
    }

    const chat = await aiKnowledgeService.getChatById(shopId, chatId);

    let report: BusinessReport;
    try {
      report = JSON.parse(chat.answer);
    } catch {
      report = { title: "Chat Report", summary: chat.answer, sections: [], recommendations: [] };
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${chatId}.pdf"`);

    doc.pipe(res);

    doc.fontSize(22).font("Helvetica-Bold").text(report.title || "Analysis Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text(
      `Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      { align: "center" },
    );
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
        const priorityColor =
          section.priority === "High" ? "#DC2626" :
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
      doc.fontSize(9).font("Helvetica").fillColor("#999999").text(
        `Original question: ${chat.question}`,
      );
    }

    doc.end();
  } catch (error) {
    logger.error(`PDF export failed: ${error}`);
    if (!res.headersSent) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to generate PDF", details: message });
    }
  }
};
