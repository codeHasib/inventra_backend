import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import * as notificationService from "../services/notification.service";

export const getNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getNotifications(shopId, page, limit);

    sendResponse(res, 200, "Notifications fetched successfully", result);
  },
);

export const getUnreadCountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const count = await notificationService.getUnreadCount(shopId);

    sendResponse(res, 200, "Unread count fetched successfully", { count });
  },
);

export const markAsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const id = req.params.id as string;

    const notification = await notificationService.markAsRead(shopId, id);

    sendResponse(res, 200, "Notification marked as read", notification);
  },
);

export const markAllAsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const modifiedCount = await notificationService.markAllAsRead(shopId);

    sendResponse(res, 200, "All notifications marked as read", { modifiedCount });
  },
);

export const deleteNotificationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const id = req.params.id as string;

    await notificationService.deleteNotification(shopId, id);

    sendResponse(res, 200, "Notification deleted successfully");
  },
);

export const deleteAllNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const modifiedCount = await notificationService.deleteAllNotifications(shopId);

    sendResponse(res, 200, "All notifications deleted successfully", { modifiedCount });
  },
);

export const generateInventoryAlertsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const created = await notificationService.generateInventoryAlerts(shopId);

    sendResponse(res, 200, "Inventory alerts generated successfully", { created });
  },
);

export const generateMonthlySalesSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const notification = await notificationService.generateMonthlySalesSummary(shopId);

    sendResponse(res, 200, "Monthly sales summary generated successfully", notification);
  },
);

export const generateMonthlyProfitSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const notification = await notificationService.generateMonthlyProfitSummary(shopId);

    sendResponse(res, 200, "Monthly profit summary generated successfully", notification);
  },
);
