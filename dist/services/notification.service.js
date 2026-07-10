"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = exports.generateMonthlyProfitSummary = exports.generateMonthlySalesSummary = exports.generateInventoryAlerts = void 0;
const mongoose_1 = require("mongoose");
const Notification_1 = require("../models/Notification");
const Product_1 = require("../models/Product");
const Sale_1 = require("../models/Sale");
const index_1 = require("../enums/index");
const AppError_1 = require("../utils/AppError");
const index_2 = require("../constants/index");
// ─── Inventory Alerts ───────────────────────────────────────────────
const generateInventoryAlerts = async (shopId) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let created = 0;
    // Out of stock
    const outOfStock = await Product_1.Product.find({
        shopId: shopObjectId,
        currentStock: 0,
        isActive: true,
        isDeleted: false,
    }).select("name sku currentStock");
    for (const p of outOfStock) {
        const exists = await Notification_1.Notification.findOne({
            shopId: shopObjectId,
            type: index_1.NotificationType.OUT_OF_STOCK,
            productId: p._id,
            isRead: false,
            isDeleted: false,
        });
        if (!exists) {
            await Notification_1.Notification.create({
                shopId: shopObjectId,
                type: index_1.NotificationType.OUT_OF_STOCK,
                title: "Out of Stock",
                message: `"${p.name}" (SKU: ${p.sku}) is out of stock.`,
                productId: p._id,
                metadata: { sku: p.sku, currentStock: p.currentStock },
            });
            created++;
        }
    }
    // Low stock (0 < stock <= reorderLevel)
    const lowStock = await Product_1.Product.find({
        shopId: shopObjectId,
        currentStock: { $gt: 0 },
        $expr: { $lte: ["$currentStock", "$reorderLevel"] },
        isActive: true,
        isDeleted: false,
    }).select("name sku currentStock reorderLevel");
    for (const p of lowStock) {
        const exists = await Notification_1.Notification.findOne({
            shopId: shopObjectId,
            type: index_1.NotificationType.LOW_STOCK,
            productId: p._id,
            isRead: false,
            isDeleted: false,
        });
        if (!exists) {
            await Notification_1.Notification.create({
                shopId: shopObjectId,
                type: index_1.NotificationType.LOW_STOCK,
                title: "Low Stock Alert",
                message: `"${p.name}" (SKU: ${p.sku}) has only ${p.currentStock} ${p.unit || "units"} left (reorder at ${p.reorderLevel}).`,
                productId: p._id,
                metadata: { sku: p.sku, currentStock: p.currentStock, reorderLevel: p.reorderLevel },
            });
            created++;
        }
    }
    // Expiring within 30 days
    const expiring = await Product_1.Product.find({
        shopId: shopObjectId,
        expiryDate: { $ne: null, $lte: thirtyDaysLater, $gt: now },
        isActive: true,
        isDeleted: false,
    }).select("name sku expiryDate currentStock");
    for (const p of expiring) {
        const exists = await Notification_1.Notification.findOne({
            shopId: shopObjectId,
            type: index_1.NotificationType.PRODUCT_EXPIRING,
            productId: p._id,
            isRead: false,
            isDeleted: false,
        });
        if (!exists) {
            const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            await Notification_1.Notification.create({
                shopId: shopObjectId,
                type: index_1.NotificationType.PRODUCT_EXPIRING,
                title: "Product Expiring Soon",
                message: `"${p.name}" (SKU: ${p.sku}) expires in ${daysLeft} day(s) (${p.currentStock} in stock).`,
                productId: p._id,
                metadata: { sku: p.sku, expiryDate: p.expiryDate, daysLeft, currentStock: p.currentStock },
            });
            created++;
        }
    }
    return created;
};
exports.generateInventoryAlerts = generateInventoryAlerts;
// ─── Monthly Sales Summary ─────────────────────────────────────────
const generateMonthlySalesSummary = async (shopId) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const result = await Sale_1.Sale.aggregate([
        {
            $match: {
                shopId: shopObjectId,
                saleDate: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$grandTotal" },
                totalItems: { $sum: { $sum: "$items.quantity" } },
            },
        },
    ]);
    const summary = result[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 };
    const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });
    const notification = await Notification_1.Notification.create({
        shopId: shopObjectId,
        type: index_1.NotificationType.MONTHLY_SALES_SUMMARY,
        title: `Sales Summary — ${monthName}`,
        message: `${summary.totalSales} sale(s) totaling $${summary.totalRevenue.toFixed(2)} with ${summary.totalItems} item(s) sold.`,
        metadata: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            totalSales: summary.totalSales,
            totalRevenue: summary.totalRevenue,
            totalItems: summary.totalItems,
        },
    });
    return notification;
};
exports.generateMonthlySalesSummary = generateMonthlySalesSummary;
// ─── Monthly Profit Summary ────────────────────────────────────────
const generateMonthlyProfitSummary = async (shopId) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const result = await Sale_1.Sale.aggregate([
        {
            $match: {
                shopId: shopObjectId,
                saleDate: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$items.total" },
                totalCost: { $sum: { $multiply: ["$items.purchasePrice", "$items.quantity"] } },
                totalProfit: { $sum: "$items.profitPerUnit" },
            },
        },
    ]);
    const summary = result[0] || { totalRevenue: 0, totalCost: 0, totalProfit: 0 };
    const profitMargin = summary.totalRevenue > 0
        ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)
        : "0.0";
    const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });
    const notification = await Notification_1.Notification.create({
        shopId: shopObjectId,
        type: index_1.NotificationType.MONTHLY_PROFIT_SUMMARY,
        title: `Profit Summary — ${monthName}`,
        message: `Revenue: $${summary.totalRevenue.toFixed(2)} | Cost: $${summary.totalCost.toFixed(2)} | Net Profit: $${summary.totalProfit.toFixed(2)} (${profitMargin}% margin).`,
        metadata: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            totalRevenue: summary.totalRevenue,
            totalCost: summary.totalCost,
            totalProfit: summary.totalProfit,
            profitMargin: parseFloat(profitMargin),
        },
    });
    return notification;
};
exports.generateMonthlyProfitSummary = generateMonthlyProfitSummary;
// ─── Queries ────────────────────────────────────────────────────────
const getNotifications = async (shopId, page = 1, limit = 20) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
        Notification_1.Notification.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification_1.Notification.countDocuments({ shopId: shopObjectId, isDeleted: false }),
        Notification_1.Notification.countDocuments({ shopId: shopObjectId, isDeleted: false, isRead: false }),
    ]);
    return { notifications, total, unreadCount };
};
exports.getNotifications = getNotifications;
const getUnreadCount = async (shopId) => {
    return Notification_1.Notification.countDocuments({
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
        isRead: false,
    });
};
exports.getUnreadCount = getUnreadCount;
// ─── Mutations ──────────────────────────────────────────────────────
const markAsRead = async (shopId, notificationId) => {
    const notification = await Notification_1.Notification.findOneAndUpdate({ _id: notificationId, shopId: new mongoose_1.Types.ObjectId(shopId), isDeleted: false }, { isRead: true }, { new: true });
    if (!notification) {
        throw new AppError_1.AppError("Notification not found", index_2.HTTP_STATUS.NOT_FOUND);
    }
    return notification;
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (shopId) => {
    const result = await Notification_1.Notification.updateMany({ shopId: new mongoose_1.Types.ObjectId(shopId), isDeleted: false, isRead: false }, { isRead: true });
    return result.modifiedCount;
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (shopId, notificationId) => {
    const result = await Notification_1.Notification.findOneAndUpdate({ _id: notificationId, shopId: new mongoose_1.Types.ObjectId(shopId), isDeleted: false }, { isDeleted: true });
    if (!result) {
        throw new AppError_1.AppError("Notification not found", index_2.HTTP_STATUS.NOT_FOUND);
    }
};
exports.deleteNotification = deleteNotification;
const deleteAllNotifications = async (shopId) => {
    const result = await Notification_1.Notification.updateMany({ shopId: new mongoose_1.Types.ObjectId(shopId), isDeleted: false }, { isDeleted: true });
    return result.modifiedCount;
};
exports.deleteAllNotifications = deleteAllNotifications;
//# sourceMappingURL=notification.service.js.map