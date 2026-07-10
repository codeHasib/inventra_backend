import { Types } from "mongoose";
import { Notification, INotification } from "../models/Notification";
import { Product } from "../models/Product";
import { Sale } from "../models/Sale";
import { NotificationType } from "../enums/index";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

// ─── Inventory Alerts ───────────────────────────────────────────────

export const generateInventoryAlerts = async (
  shopId: string,
): Promise<number> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let created = 0;

  // Out of stock
  const outOfStock = await Product.find({
    shopId: shopObjectId,
    currentStock: 0,
    isActive: true,
    isDeleted: false,
  }).select("name sku currentStock");

  for (const p of outOfStock) {
    const exists = await Notification.findOne({
      shopId: shopObjectId,
      type: NotificationType.OUT_OF_STOCK,
      productId: p._id,
      isRead: false,
      isDeleted: false,
    });
    if (!exists) {
      await Notification.create({
        shopId: shopObjectId,
        type: NotificationType.OUT_OF_STOCK,
        title: "Out of Stock",
        message: `"${p.name}" (SKU: ${p.sku}) is out of stock.`,
        productId: p._id,
        metadata: { sku: p.sku, currentStock: p.currentStock },
      });
      created++;
    }
  }

  // Low stock (0 < stock <= reorderLevel)
  const lowStock = await Product.find({
    shopId: shopObjectId,
    currentStock: { $gt: 0 },
    $expr: { $lte: ["$currentStock", "$reorderLevel"] },
    isActive: true,
    isDeleted: false,
  }).select("name sku currentStock reorderLevel");

  for (const p of lowStock) {
    const exists = await Notification.findOne({
      shopId: shopObjectId,
      type: NotificationType.LOW_STOCK,
      productId: p._id,
      isRead: false,
      isDeleted: false,
    });
    if (!exists) {
      await Notification.create({
        shopId: shopObjectId,
        type: NotificationType.LOW_STOCK,
        title: "Low Stock Alert",
        message: `"${p.name}" (SKU: ${p.sku}) has only ${p.currentStock} ${p.unit || "units"} left (reorder at ${p.reorderLevel}).`,
        productId: p._id,
        metadata: { sku: p.sku, currentStock: p.currentStock, reorderLevel: p.reorderLevel },
      });
      created++;
    }
  }

  // Expiring within 30 days
  const expiring = await Product.find({
    shopId: shopObjectId,
    expiryDate: { $ne: null, $lte: thirtyDaysLater, $gt: now },
    isActive: true,
    isDeleted: false,
  }).select("name sku expiryDate currentStock");

  for (const p of expiring) {
    const exists = await Notification.findOne({
      shopId: shopObjectId,
      type: NotificationType.PRODUCT_EXPIRING,
      productId: p._id,
      isRead: false,
      isDeleted: false,
    });
    if (!exists) {
      const daysLeft = Math.ceil(
        (new Date(p.expiryDate!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
      await Notification.create({
        shopId: shopObjectId,
        type: NotificationType.PRODUCT_EXPIRING,
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

// ─── Monthly Sales Summary ─────────────────────────────────────────

export const generateMonthlySalesSummary = async (
  shopId: string,
): Promise<INotification> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await Sale.aggregate([
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

  const notification = await Notification.create({
    shopId: shopObjectId,
    type: NotificationType.MONTHLY_SALES_SUMMARY,
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

// ─── Monthly Profit Summary ────────────────────────────────────────

export const generateMonthlyProfitSummary = async (
  shopId: string,
): Promise<INotification> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await Sale.aggregate([
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

  const notification = await Notification.create({
    shopId: shopObjectId,
    type: NotificationType.MONTHLY_PROFIT_SUMMARY,
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

// ─── Queries ────────────────────────────────────────────────────────

export const getNotifications = async (
  shopId: string,
  page = 1,
  limit = 20,
): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ shopId: shopObjectId, isDeleted: false }),
    Notification.countDocuments({ shopId: shopObjectId, isDeleted: false, isRead: false }),
  ]);

  return { notifications, total, unreadCount };
};

export const getUnreadCount = async (shopId: string): Promise<number> => {
  return Notification.countDocuments({
    shopId: new Types.ObjectId(shopId),
    isDeleted: false,
    isRead: false,
  });
};

// ─── Mutations ──────────────────────────────────────────────────────

export const markAsRead = async (
  shopId: string,
  notificationId: string,
): Promise<INotification> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, shopId: new Types.ObjectId(shopId), isDeleted: false },
    { isRead: true },
    { new: true },
  );
  if (!notification) {
    throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
  }
  return notification;
};

export const markAllAsRead = async (shopId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { shopId: new Types.ObjectId(shopId), isDeleted: false, isRead: false },
    { isRead: true },
  );
  return result.modifiedCount;
};

export const deleteNotification = async (
  shopId: string,
  notificationId: string,
): Promise<void> => {
  const result = await Notification.findOneAndUpdate(
    { _id: notificationId, shopId: new Types.ObjectId(shopId), isDeleted: false },
    { isDeleted: true },
  );
  if (!result) {
    throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
  }
};

export const deleteAllNotifications = async (shopId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { shopId: new Types.ObjectId(shopId), isDeleted: false },
    { isDeleted: true },
  );
  return result.modifiedCount;
};
