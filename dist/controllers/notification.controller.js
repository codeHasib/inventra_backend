"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMonthlyProfitSummaryHandler = exports.generateMonthlySalesSummaryHandler = exports.generateInventoryAlertsHandler = exports.deleteAllNotificationsHandler = exports.deleteNotificationHandler = exports.markAllAsReadHandler = exports.markAsReadHandler = exports.getUnreadCountHandler = exports.getNotificationsHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const notificationService = __importStar(require("../services/notification.service"));
exports.getNotificationsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationService.getNotifications(shopId, page, limit);
    (0, response_1.sendResponse)(res, 200, "Notifications fetched successfully", result);
});
exports.getUnreadCountHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const count = await notificationService.getUnreadCount(shopId);
    (0, response_1.sendResponse)(res, 200, "Unread count fetched successfully", { count });
});
exports.markAsReadHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const id = req.params.id;
    const notification = await notificationService.markAsRead(shopId, id);
    (0, response_1.sendResponse)(res, 200, "Notification marked as read", notification);
});
exports.markAllAsReadHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const modifiedCount = await notificationService.markAllAsRead(shopId);
    (0, response_1.sendResponse)(res, 200, "All notifications marked as read", { modifiedCount });
});
exports.deleteNotificationHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const id = req.params.id;
    await notificationService.deleteNotification(shopId, id);
    (0, response_1.sendResponse)(res, 200, "Notification deleted successfully");
});
exports.deleteAllNotificationsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const modifiedCount = await notificationService.deleteAllNotifications(shopId);
    (0, response_1.sendResponse)(res, 200, "All notifications deleted successfully", { modifiedCount });
});
exports.generateInventoryAlertsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const created = await notificationService.generateInventoryAlerts(shopId);
    (0, response_1.sendResponse)(res, 200, "Inventory alerts generated successfully", { created });
});
exports.generateMonthlySalesSummaryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const notification = await notificationService.generateMonthlySalesSummary(shopId);
    (0, response_1.sendResponse)(res, 200, "Monthly sales summary generated successfully", notification);
});
exports.generateMonthlyProfitSummaryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const notification = await notificationService.generateMonthlyProfitSummary(shopId);
    (0, response_1.sendResponse)(res, 200, "Monthly profit summary generated successfully", notification);
});
//# sourceMappingURL=notification.controller.js.map