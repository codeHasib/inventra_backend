import { Types } from "mongoose";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Sale } from "../models/Sale";
import { Purchase } from "../models/Purchase";
import { Product } from "../models/Product";
import { Expense } from "../models/Expense";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { PaymentStatus, ProductStatus } from "../enums/index";

type ReportFormat = "pdf" | "excel" | "csv";
type DateRange = "today" | "thisWeek" | "thisMonth" | "thisYear" | "last7Days" | "last30Days" | "custom";

interface DateRangeResult {
  start: Date;
  end: Date;
}

const round = (val: number): number => Number(val.toFixed(2));

const getDateRange = (range: DateRange, startDate?: string, endDate?: string): DateRangeResult => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "thisWeek": {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "thisYear":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "last7Days":
      start.setTime(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case "last30Days":
      start.setTime(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (startDate) start.setTime(new Date(startDate).getTime());
      else start.setHours(0, 0, 0, 0);
      if (endDate) {
        end.setTime(new Date(endDate).getTime());
        end.setHours(23, 59, 59, 999);
      }
      break;
  }

  return { start, end };
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (val: number): string => {
  return `$${val.toFixed(2)}`;
};

interface SalesReportData {
  period: { start: string; end: string };
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalDiscount: number;
    totalTax: number;
    averageSaleValue: number;
  };
  byPaymentMethod: { method: string; count: number; revenue: number }[];
  byPaymentStatus: { status: string; count: number }[];
  dailyTrend: { date: string; count: number; revenue: number }[];
  topProducts: { productName: string; sku: string; quantitySold: number; revenue: number }[];
  chartData: {
    dailyRevenue: { label: string; value: number }[];
    paymentMethodDistribution: { label: string; value: number }[];
  };
}

const getSalesReport = async (
  shopId: string,
  dateRange: DateRangeResult,
): Promise<SalesReportData> => {
  const oid = new Types.ObjectId(shopId);
  const matchStage = {
    shopId: oid,
    isDeleted: false,
    paymentStatus: { $ne: PaymentStatus.REFUNDED },
    saleDate: { $gte: dateRange.start, $lte: dateRange.end },
  };

  const [summaryAgg, byMethod, byStatus, dailyTrend, topProducts] = await Promise.all([
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          totalDiscount: { $sum: "$discount" },
          totalTax: { $sum: "$tax" },
        },
      },
    ]),
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$grandTotal" },
        },
      },
      { $project: { _id: 0, method: "$_id", count: 1, revenue: { $round: ["$revenue", 2] } } },
    ]),
    Sale.aggregate([
      { $match: { ...matchStage, paymentStatus: { $ne: PaymentStatus.REFUNDED } } },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]),
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
          count: { $sum: 1 },
          revenue: { $sum: "$grandTotal" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1, revenue: { $round: ["$revenue", 2] } } },
    ]),
    Sale.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: { productName: "$items.productName", sku: "$items.sku" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productName: "$_id.productName",
          sku: "$_id.sku",
          quantitySold: 1,
          revenue: { $round: ["$revenue", 2] },
        },
      },
    ]),
  ]);

  const s = summaryAgg[0] || { totalSales: 0, totalRevenue: 0, totalDiscount: 0, totalTax: 0 };

  return {
    period: { start: formatDate(dateRange.start), end: formatDate(dateRange.end) },
    summary: {
      totalSales: s.totalSales,
      totalRevenue: round(s.totalRevenue),
      totalDiscount: round(s.totalDiscount),
      totalTax: round(s.totalTax),
      averageSaleValue: s.totalSales > 0 ? round(s.totalRevenue / s.totalSales) : 0,
    },
    byPaymentMethod: byMethod,
    byPaymentStatus: byStatus,
    dailyTrend,
    topProducts,
    chartData: {
      dailyRevenue: dailyTrend.map((d) => ({ label: d.date, value: d.revenue })),
      paymentMethodDistribution: byMethod.map((m) => ({ label: m.method, value: m.revenue })),
    },
  };
};

interface PurchaseReportData {
  period: { start: string; end: string };
  summary: {
    totalPurchases: number;
    totalValue: number;
    totalDiscount: number;
    totalTax: number;
    averagePurchaseValue: number;
  };
  byPaymentStatus: { status: string; count: number; value: number }[];
  bySupplier: { supplierName: string; company: string; count: number; value: number }[];
  dailyTrend: { date: string; count: number; value: number }[];
  chartData: {
    dailyValue: { label: string; value: number }[];
    statusDistribution: { label: string; value: number }[];
  };
}

const getPurchaseReport = async (
  shopId: string,
  dateRange: DateRangeResult,
): Promise<PurchaseReportData> => {
  const oid = new Types.ObjectId(shopId);
  const matchStage = {
    shopId: oid,
    isDeleted: false,
    purchaseDate: { $gte: dateRange.start, $lte: dateRange.end },
  };

  const [summaryAgg, byStatus, bySupplier, dailyTrend] = await Promise.all([
    Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalValue: { $sum: "$total" },
          totalDiscount: { $sum: "$discount" },
          totalTax: { $sum: "$tax" },
        },
      },
    ]),
    Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          value: { $sum: "$total" },
        },
      },
      { $project: { _id: 0, status: "$_id", count: 1, value: { $round: ["$value", 2] } } },
    ]),
    Purchase.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier",
        },
      },
      { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$supplierId",
          supplierName: { $first: { $ifNull: ["$supplier.name", "Unknown"] } },
          company: { $first: { $ifNull: ["$supplier.company", ""] } },
          count: { $sum: 1 },
          value: { $sum: "$total" },
        },
      },
      { $sort: { value: -1 } },
      {
        $project: {
          _id: 0,
          supplierName: 1,
          company: 1,
          count: 1,
          value: { $round: ["$value", 2] },
        },
      },
    ]),
    Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
          count: { $sum: 1 },
          value: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1, value: { $round: ["$value", 2] } } },
    ]),
  ]);

  const s = summaryAgg[0] || { totalPurchases: 0, totalValue: 0, totalDiscount: 0, totalTax: 0 };

  return {
    period: { start: formatDate(dateRange.start), end: formatDate(dateRange.end) },
    summary: {
      totalPurchases: s.totalPurchases,
      totalValue: round(s.totalValue),
      totalDiscount: round(s.totalDiscount),
      totalTax: round(s.totalTax),
      averagePurchaseValue: s.totalPurchases > 0 ? round(s.totalValue / s.totalPurchases) : 0,
    },
    byPaymentStatus: byStatus,
    bySupplier,
    dailyTrend,
    chartData: {
      dailyValue: dailyTrend.map((d) => ({ label: d.date, value: d.value })),
      statusDistribution: byStatus.map((s) => ({ label: s.status, value: s.value })),
    },
  };
};

interface InventoryReportData {
  summary: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    discontinuedProducts: number;
    inventoryValue: number;
    inventoryCost: number;
    potentialRevenue: number;
    totalProfitPotential: number;
  };
  byCategory: { category: string; count: number; value: number; cost: number }[];
  byStatus: { status: string; count: number }[];
  stockLevels: {
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    reorderLevel: number;
    value: number;
    status: string;
  }[];
  chartData: {
    statusDistribution: { label: string; value: number }[];
    categoryValue: { label: string; value: number }[];
  };
}

const getInventoryReport = async (shopId: string): Promise<InventoryReportData> => {
  const oid = new Types.ObjectId(shopId);

  const [statusAgg, byCategory, byStatus, stockLevels] = await Promise.all([
    Product.aggregate([
      { $match: { shopId: oid, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ["$status", ProductStatus.ACTIVE] }, 1, 0] },
          },
          lowStockProducts: {
            $sum: { $cond: [{ $eq: ["$status", ProductStatus.LOW_STOCK] }, 1, 0] },
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ["$status", ProductStatus.OUT_OF_STOCK] }, 1, 0] },
          },
          discontinuedProducts: {
            $sum: { $cond: [{ $eq: ["$status", ProductStatus.DISCONTINUED] }, 1, 0] },
          },
          inventoryValue: { $sum: { $multiply: ["$currentStock", "$sellingPrice"] } },
          inventoryCost: { $sum: { $multiply: ["$currentStock", "$purchasePrice"] } },
        },
      },
    ]),
    Product.aggregate([
      { $match: { shopId: oid, isDeleted: false } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryId",
          category: { $first: { $ifNull: ["$category.name", "Uncategorized"] } },
          count: { $sum: 1 },
          value: { $sum: { $multiply: ["$currentStock", "$sellingPrice"] } },
          cost: { $sum: { $multiply: ["$currentStock", "$purchasePrice"] } },
        },
      },
      { $sort: { value: -1 } },
      {
        $project: {
          _id: 0,
          category: 1,
          count: 1,
          value: { $round: ["$value", 2] },
          cost: { $round: ["$cost", 2] },
        },
      },
    ]),
    Product.aggregate([
      { $match: { shopId: oid, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]),
    Product.aggregate([
      { $match: { shopId: oid, isDeleted: false } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          sku: 1,
          category: { $ifNull: ["$category.name", "Uncategorized"] },
          currentStock: 1,
          reorderLevel: 1,
          value: { $round: [{ $multiply: ["$currentStock", "$sellingPrice"] }, 2] },
          status: 1,
        },
      },
      { $sort: { currentStock: 1 } },
      { $limit: 50 },
    ]),
  ]);

  const s = statusAgg[0] || {
    totalProducts: 0, activeProducts: 0, lowStockProducts: 0,
    outOfStockProducts: 0, discontinuedProducts: 0,
    inventoryValue: 0, inventoryCost: 0,
  };

  return {
    summary: {
      totalProducts: s.totalProducts,
      activeProducts: s.activeProducts,
      lowStockProducts: s.lowStockProducts,
      outOfStockProducts: s.outOfStockProducts,
      discontinuedProducts: s.discontinuedProducts,
      inventoryValue: round(s.inventoryValue),
      inventoryCost: round(s.inventoryCost),
      potentialRevenue: round(s.inventoryValue),
      totalProfitPotential: round(s.inventoryValue - s.inventoryCost),
    },
    byCategory,
    byStatus,
    stockLevels,
    chartData: {
      statusDistribution: byStatus.map((s) => ({ label: s.status, value: s.count })),
      categoryValue: byCategory.map((c) => ({ label: c.category, value: c.value })),
    },
  };
};

interface ExpenseReportData {
  period: { start: string; end: string };
  summary: {
    totalExpenses: number;
    totalTransactions: number;
    averageExpense: number;
  };
  byCategory: { category: string; count: number; totalAmount: number }[];
  dailyTrend: { date: string; count: number; totalAmount: number }[];
  chartData: {
    categoryDistribution: { label: string; value: number }[];
    dailyExpenses: { label: string; value: number }[];
  };
}

const getExpenseReport = async (
  shopId: string,
  dateRange: DateRangeResult,
): Promise<ExpenseReportData> => {
  const oid = new Types.ObjectId(shopId);
  const matchStage = {
    shopId: oid,
    expenseDate: { $gte: dateRange.start, $lte: dateRange.end },
  };

  const [summaryAgg, byCategory, dailyTrend] = await Promise.all([
    Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $project: { _id: 0, category: "$_id", count: 1, totalAmount: { $round: ["$totalAmount", 2] } } },
    ]),
    Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1, totalAmount: { $round: ["$totalAmount", 2] } } },
    ]),
  ]);

  const s = summaryAgg[0] || { totalExpenses: 0, totalTransactions: 0 };

  return {
    period: { start: formatDate(dateRange.start), end: formatDate(dateRange.end) },
    summary: {
      totalExpenses: round(s.totalExpenses),
      totalTransactions: s.totalTransactions,
      averageExpense: s.totalTransactions > 0 ? round(s.totalExpenses / s.totalTransactions) : 0,
    },
    byCategory,
    dailyTrend,
    chartData: {
      categoryDistribution: byCategory.map((c) => ({ label: c.category, value: c.totalAmount })),
      dailyExpenses: dailyTrend.map((d) => ({ label: d.date, value: d.totalAmount })),
    },
  };
};

interface ProfitReportData {
  period: { start: string; end: string };
  summary: {
    totalRevenue: number;
    totalCostOfGoods: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  dailyTrend: { date: string; revenue: number; cost: number; profit: number }[];
  chartData: {
    dailyProfit: { label: string; value: number }[];
    marginTrend: { label: string; value: number }[];
  };
}

const getProfitReport = async (
  shopId: string,
  dateRange: DateRangeResult,
): Promise<ProfitReportData> => {
  const oid = new Types.ObjectId(shopId);
  const saleMatch = {
    shopId: oid,
    isDeleted: false,
    paymentStatus: { $ne: PaymentStatus.REFUNDED },
    saleDate: { $gte: dateRange.start, $lte: dateRange.end },
  };
  const expenseMatch = {
    shopId: oid,
    expenseDate: { $gte: dateRange.start, $lte: dateRange.end },
  };

  const [revenueAgg, costAgg, expenseAgg, dailyTrend] = await Promise.all([
    Sale.aggregate([
      { $match: saleMatch },
      { $group: { _id: null, totalRevenue: { $sum: "$grandTotal" } } },
    ]),
    Sale.aggregate([
      { $match: saleMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalCost: { $sum: { $multiply: ["$items.purchasePrice", "$items.quantity"] } },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
    ]),
    Sale.aggregate([
      { $match: saleMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
          revenue: { $sum: "$items.total" },
          cost: { $sum: { $multiply: ["$items.purchasePrice", "$items.quantity"] } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: { $round: ["$revenue", 2] },
          cost: { $round: ["$cost", 2] },
          profit: { $round: [{ $subtract: ["$revenue", "$cost"] }, 2] },
        },
      },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
  const totalCost = costAgg[0]?.totalCost || 0;
  const totalExpenses = expenseAgg[0]?.totalExpenses || 0;
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;

  return {
    period: { start: formatDate(dateRange.start), end: formatDate(dateRange.end) },
    summary: {
      totalRevenue: round(totalRevenue),
      totalCostOfGoods: round(totalCost),
      totalExpenses: round(totalExpenses),
      grossProfit: round(grossProfit),
      netProfit: round(netProfit),
      grossMargin: totalRevenue > 0 ? round((grossProfit / totalRevenue) * 100) : 0,
      netMargin: totalRevenue > 0 ? round((netProfit / totalRevenue) * 100) : 0,
    },
    dailyTrend,
    chartData: {
      dailyProfit: dailyTrend.map((d) => ({ label: d.date, value: d.profit })),
      marginTrend: dailyTrend.map((d) => ({
        label: d.date,
        value: d.revenue > 0 ? round(((d.revenue - d.cost) / d.revenue) * 100) : 0,
      })),
    },
  };
};

interface RevenueReportData {
  period: { start: string; end: string };
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
  };
  byPaymentMethod: { method: string; count: number; revenue: number }[];
  dailyTrend: { date: string; count: number; revenue: number }[];
  monthlyComparison: { month: string; revenue: number }[];
  chartData: {
    dailyRevenue: { label: string; value: number }[];
    paymentMethodRevenue: { label: string; value: number }[];
  };
}

const getRevenueReport = async (
  shopId: string,
  dateRange: DateRangeResult,
): Promise<RevenueReportData> => {
  const oid = new Types.ObjectId(shopId);
  const matchStage = {
    shopId: oid,
    isDeleted: false,
    paymentStatus: { $ne: PaymentStatus.REFUNDED },
    saleDate: { $gte: dateRange.start, $lte: dateRange.end },
  };

  const [summaryAgg, byMethod, dailyTrend] = await Promise.all([
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]),
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$grandTotal" },
        },
      },
      { $project: { _id: 0, method: "$_id", count: 1, revenue: { $round: ["$revenue", 2] } } },
    ]),
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
          count: { $sum: 1 },
          revenue: { $sum: "$grandTotal" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1, revenue: { $round: ["$revenue", 2] } } },
    ]),
  ]);

  const s = summaryAgg[0] || { totalRevenue: 0, totalTransactions: 0 };

  return {
    period: { start: formatDate(dateRange.start), end: formatDate(dateRange.end) },
    summary: {
      totalRevenue: round(s.totalRevenue),
      totalTransactions: s.totalTransactions,
      averageTransactionValue: s.totalTransactions > 0 ? round(s.totalRevenue / s.totalTransactions) : 0,
    },
    byPaymentMethod: byMethod,
    dailyTrend,
    monthlyComparison: [],
    chartData: {
      dailyRevenue: dailyTrend.map((d) => ({ label: d.date, value: d.revenue })),
      paymentMethodRevenue: byMethod.map((m) => ({ label: m.method, value: m.revenue })),
    },
  };
};

const generateSalesCsv = (data: SalesReportData): string => {
  const rows: string[] = [];
  rows.push("Sales Report");
  rows.push(`Period: ${data.period.start} to ${data.period.end}`);
  rows.push("");
  rows.push("Summary");
  rows.push("Metric,Value");
  rows.push(`Total Sales,${data.summary.totalSales}`);
  rows.push(`Total Revenue,${data.summary.totalRevenue}`);
  rows.push(`Total Discount,${data.summary.totalDiscount}`);
  rows.push(`Total Tax,${data.summary.totalTax}`);
  rows.push(`Average Sale Value,${data.summary.averageSaleValue}`);
  rows.push("");
  rows.push("Daily Trend");
  rows.push("Date,Sales Count,Revenue");
  for (const d of data.dailyTrend) {
    rows.push(`${d.date},${d.count},${d.revenue}`);
  }
  rows.push("");
  rows.push("Top Products");
  rows.push("Product,SKU,Quantity Sold,Revenue");
  for (const p of data.topProducts) {
    rows.push(`"${p.productName}",${p.sku},${p.quantitySold},${p.revenue}`);
  }
  return rows.join("\n");
};

const generatePurchaseCsv = (data: PurchaseReportData): string => {
  const rows: string[] = [];
  rows.push("Purchase Report");
  rows.push(`Period: ${data.period.start} to ${data.period.end}`);
  rows.push("");
  rows.push("Summary");
  rows.push("Metric,Value");
  rows.push(`Total Purchases,${data.summary.totalPurchases}`);
  rows.push(`Total Value,${data.summary.totalValue}`);
  rows.push(`Average Purchase Value,${data.summary.averagePurchaseValue}`);
  rows.push("");
  rows.push("By Supplier");
  rows.push("Supplier,Company,Count,Value");
  for (const s of data.bySupplier) {
    rows.push(`"${s.supplierName}","${s.company}",${s.count},${s.value}`);
  }
  return rows.join("\n");
};

const generateInventoryCsv = (data: InventoryReportData): string => {
  const rows: string[] = [];
  rows.push("Inventory Report");
  rows.push("");
  rows.push("Summary");
  rows.push("Metric,Value");
  rows.push(`Total Products,${data.summary.totalProducts}`);
  rows.push(`Active Products,${data.summary.activeProducts}`);
  rows.push(`Low Stock Products,${data.summary.lowStockProducts}`);
  rows.push(`Out of Stock Products,${data.summary.outOfStockProducts}`);
  rows.push(`Inventory Value,${data.summary.inventoryValue}`);
  rows.push(`Inventory Cost,${data.summary.inventoryCost}`);
  rows.push("");
  rows.push("Stock Levels");
  rows.push("Name,SKU,Category,Current Stock,Reorder Level,Value,Status");
  for (const p of data.stockLevels) {
    rows.push(`"${p.name}",${p.sku},"${p.category}",${p.currentStock},${p.reorderLevel},${p.value},${p.status}`);
  }
  return rows.join("\n");
};

const generateExpenseCsv = (data: ExpenseReportData): string => {
  const rows: string[] = [];
  rows.push("Expense Report");
  rows.push(`Period: ${data.period.start} to ${data.period.end}`);
  rows.push("");
  rows.push("Summary");
  rows.push("Metric,Value");
  rows.push(`Total Expenses,${data.summary.totalExpenses}`);
  rows.push(`Total Transactions,${data.summary.totalTransactions}`);
  rows.push(`Average Expense,${data.summary.averageExpense}`);
  rows.push("");
  rows.push("By Category");
  rows.push("Category,Count,Total Amount");
  for (const c of data.byCategory) {
    rows.push(`"${c.category}",${c.count},${c.totalAmount}`);
  }
  return rows.join("\n");
};

const generateProfitCsv = (data: ProfitReportData): string => {
  const rows: string[] = [];
  rows.push("Profit Report");
  rows.push(`Period: ${data.period.start} to ${data.period.end}`);
  rows.push("");
  rows.push("Summary");
  rows.push("Metric,Value");
  rows.push(`Total Revenue,${data.summary.totalRevenue}`);
  rows.push(`Cost of Goods,${data.summary.totalCostOfGoods}`);
  rows.push(`Total Expenses,${data.summary.totalExpenses}`);
  rows.push(`Gross Profit,${data.summary.grossProfit}`);
  rows.push(`Net Profit,${data.summary.netProfit}`);
  rows.push(`Gross Margin,${data.summary.grossMargin}%`);
  rows.push(`Net Margin,${data.summary.netMargin}%`);
  rows.push("");
  rows.push("Daily Trend");
  rows.push("Date,Revenue,Cost,Profit");
  for (const d of data.dailyTrend) {
    rows.push(`${d.date},${d.revenue},${d.cost},${d.profit}`);
  }
  return rows.join("\n");
};

const generateRevenueCsv = (data: RevenueReportData): string => {
  const rows: string[] = [];
  rows.push("Revenue Report");
  rows.push(`Period: ${data.period.start} to ${data.period.end}`);
  rows.push("");
  rows.push("Summary");
  rows.push("Metric,Value");
  rows.push(`Total Revenue,${data.summary.totalRevenue}`);
  rows.push(`Total Transactions,${data.summary.totalTransactions}`);
  rows.push(`Average Transaction Value,${data.summary.averageTransactionValue}`);
  rows.push("");
  rows.push("Daily Trend");
  rows.push("Date,Transactions,Revenue");
  for (const d of data.dailyTrend) {
    rows.push(`${d.date},${d.count},${d.revenue}`);
  }
  return rows.join("\n");
};

const buildPdfTable = (doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startY: number): number => {
  const colWidth = 480 / headers.length;
  let y = startY;

  doc.fontSize(8).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, 50 + i * colWidth, y, { width: colWidth, align: "left" });
  });
  y += 15;

  doc.font("Helvetica");
  for (const row of rows) {
    if (y > 750) {
      doc.addPage();
      y = 50;
      doc.font("Helvetica-Bold");
      headers.forEach((h, i) => {
        doc.text(h, 50 + i * colWidth, y, { width: colWidth, align: "left" });
      });
      y += 15;
      doc.font("Helvetica");
    }
    row.forEach((cell, i) => {
      doc.text(String(cell), 50 + i * colWidth, y, { width: colWidth, align: "left" });
    });
    y += 12;
  }

  return y;
};

const generatePdf = (
  title: string,
  headers: string[],
  rows: string[][],
  summaryRows: string[][],
): Buffer => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica-Bold").text("Summary:", 50);
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(9);
  for (const row of summaryRows) {
    doc.text(`${row[0]}: ${row[1]}`, 60);
  }
  doc.moveDown(0.5);

  const y = buildPdfTable(doc, headers, rows, doc.y + 10);

  doc.end();

  return Buffer.concat(chunks);
};

const buildExcel = async (
  title: string,
  sheets: { name: string; headers: string[]; rows: string[][] }[],
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventra AI";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);

    ws.columns = sheet.headers.map((h) => ({ header: h, key: h, width: 20 }));

    ws.getRow(1).font = { bold: true, size: 11 };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    for (const row of sheet.rows) {
      ws.addRow(row);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const getReportData = async (
  shopId: string,
  reportType: string,
  dateRange: DateRangeResult,
) => {
  switch (reportType) {
    case "sales":
      return getSalesReport(shopId, dateRange);
    case "purchases":
      return getPurchaseReport(shopId, dateRange);
    case "inventory":
      return getInventoryReport(shopId);
    case "expenses":
      return getExpenseReport(shopId, dateRange);
    case "profit":
      return getProfitReport(shopId, dateRange);
    case "revenue":
      return getRevenueReport(shopId, dateRange);
    default:
      throw new AppError(`Invalid report type: ${reportType}`, HTTP_STATUS.BAD_REQUEST);
  }
};

const generateReport = async (
  shopId: string,
  reportType: string,
  format: ReportFormat,
  dateRangeType: DateRange,
  startDate?: string,
  endDate?: string,
): Promise<{ data: Buffer; contentType: string; fileName: string }> => {
  const dateRange = getDateRange(dateRangeType, startDate, endDate);
  const data = await getReportData(shopId, reportType, dateRange);

  const fileName = `${reportType}-report-${Date.now()}`;

  if (format === "csv") {
    let csv = "";
    switch (reportType) {
      case "sales":
        csv = generateSalesCsv(data as SalesReportData);
        break;
      case "purchases":
        csv = generatePurchaseCsv(data as PurchaseReportData);
        break;
      case "inventory":
        csv = generateInventoryCsv(data as InventoryReportData);
        break;
      case "expenses":
        csv = generateExpenseCsv(data as ExpenseReportData);
        break;
      case "profit":
        csv = generateProfitCsv(data as ProfitReportData);
        break;
      case "revenue":
        csv = generateRevenueCsv(data as RevenueReportData);
        break;
    }
    return {
      data: Buffer.from(csv, "utf-8"),
      contentType: "text/csv",
      fileName: `${fileName}.csv`,
    };
  }

  if (format === "excel") {
    const sheets = getExcelSheets(reportType, data as unknown as Record<string, unknown>);
    const excelBuffer = await buildExcel(
      `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      sheets,
    );
    return {
      data: excelBuffer,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: `${fileName}.xlsx`,
    };
  }

  const pdfResult = getPdfData(reportType, data as unknown as Record<string, unknown>);
  const pdfBuffer = generatePdf(
    pdfResult.title,
    pdfResult.headers,
    pdfResult.rows,
    pdfResult.summaryRows,
  );
  return {
    data: pdfBuffer,
    contentType: "application/pdf",
    fileName: `${fileName}.pdf`,
  };
};

interface PdfResult {
  title: string;
  headers: string[];
  rows: string[][];
  summaryRows: string[][];
}

const getPdfData = (reportType: string, data: Record<string, unknown>): PdfResult => {
  switch (reportType) {
    case "sales": {
      const d = data as unknown as SalesReportData;
      return {
        title: `Sales Report (${d.period.start} - ${d.period.end})`,
        headers: ["Date", "Sales Count", "Revenue"],
        rows: d.dailyTrend.map((r) => [r.date, String(r.count), formatCurrency(r.revenue)]),
        summaryRows: [
          ["Total Sales", String(d.summary.totalSales)],
          ["Total Revenue", formatCurrency(d.summary.totalRevenue)],
          ["Average Sale Value", formatCurrency(d.summary.averageSaleValue)],
        ],
      };
    }
    case "purchases": {
      const d = data as unknown as PurchaseReportData;
      return {
        title: `Purchase Report (${d.period.start} - ${d.period.end})`,
        headers: ["Date", "Purchases", "Value"],
        rows: d.dailyTrend.map((r) => [r.date, String(r.count), formatCurrency(r.value)]),
        summaryRows: [
          ["Total Purchases", String(d.summary.totalPurchases)],
          ["Total Value", formatCurrency(d.summary.totalValue)],
          ["Average Purchase", formatCurrency(d.summary.averagePurchaseValue)],
        ],
      };
    }
    case "inventory": {
      const d = data as unknown as InventoryReportData;
      return {
        title: "Inventory Report",
        headers: ["Product", "SKU", "Category", "Stock", "Value", "Status"],
        rows: d.stockLevels.map((r) => [
          r.name, r.sku, r.category, String(r.currentStock),
          formatCurrency(r.value), r.status,
        ]),
        summaryRows: [
          ["Total Products", String(d.summary.totalProducts)],
          ["Inventory Value", formatCurrency(d.summary.inventoryValue)],
          ["Low Stock", String(d.summary.lowStockProducts)],
        ],
      };
    }
    case "expenses": {
      const d = data as unknown as ExpenseReportData;
      return {
        title: `Expense Report (${d.period.start} - ${d.period.end})`,
        headers: ["Date", "Count", "Amount"],
        rows: d.dailyTrend.map((r) => [r.date, String(r.count), formatCurrency(r.totalAmount)]),
        summaryRows: [
          ["Total Expenses", formatCurrency(d.summary.totalExpenses)],
          ["Total Transactions", String(d.summary.totalTransactions)],
          ["Average Expense", formatCurrency(d.summary.averageExpense)],
        ],
      };
    }
    case "profit": {
      const d = data as unknown as ProfitReportData;
      return {
        title: `Profit Report (${d.period.start} - ${d.period.end})`,
        headers: ["Date", "Revenue", "Cost", "Profit"],
        rows: d.dailyTrend.map((r) => [
          r.date, formatCurrency(r.revenue), formatCurrency(r.cost), formatCurrency(r.profit),
        ]),
        summaryRows: [
          ["Revenue", formatCurrency(d.summary.totalRevenue)],
          ["Cost of Goods", formatCurrency(d.summary.totalCostOfGoods)],
          ["Expenses", formatCurrency(d.summary.totalExpenses)],
          ["Gross Profit", formatCurrency(d.summary.grossProfit)],
          ["Net Profit", formatCurrency(d.summary.netProfit)],
          ["Gross Margin", `${d.summary.grossMargin}%`],
          ["Net Margin", `${d.summary.netMargin}%`],
        ],
      };
    }
    case "revenue": {
      const d = data as unknown as RevenueReportData;
      return {
        title: `Revenue Report (${d.period.start} - ${d.period.end})`,
        headers: ["Date", "Transactions", "Revenue"],
        rows: d.dailyTrend.map((r) => [r.date, String(r.count), formatCurrency(r.revenue)]),
        summaryRows: [
          ["Total Revenue", formatCurrency(d.summary.totalRevenue)],
          ["Total Transactions", String(d.summary.totalTransactions)],
          ["Average Transaction", formatCurrency(d.summary.averageTransactionValue)],
        ],
      };
    }
    default:
      return { title: "Report", headers: [], rows: [], summaryRows: [] };
  }
};

interface ExcelSheet {
  name: string;
  headers: string[];
  rows: string[][];
}

const getExcelSheets = (reportType: string, data: Record<string, unknown>): ExcelSheet[] => {
  switch (reportType) {
    case "sales": {
      const d = data as unknown as SalesReportData;
      return [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Sales", String(d.summary.totalSales)],
            ["Total Revenue", formatCurrency(d.summary.totalRevenue)],
            ["Average Sale", formatCurrency(d.summary.averageSaleValue)],
          ],
        },
        {
          name: "Daily Trend",
          headers: ["Date", "Sales", "Revenue"],
          rows: d.dailyTrend.map((r) => [r.date, String(r.count), formatCurrency(r.revenue)]),
        },
        {
          name: "Top Products",
          headers: ["Product", "SKU", "Qty Sold", "Revenue"],
          rows: d.topProducts.map((r) => [
            r.productName, r.sku, String(r.quantitySold), formatCurrency(r.revenue),
          ]),
        },
      ];
    }
    case "purchases": {
      const d = data as unknown as PurchaseReportData;
      return [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Purchases", String(d.summary.totalPurchases)],
            ["Total Value", formatCurrency(d.summary.totalValue)],
          ],
        },
        {
          name: "By Supplier",
          headers: ["Supplier", "Company", "Count", "Value"],
          rows: d.bySupplier.map((r) => [
            r.supplierName, r.company, String(r.count), formatCurrency(r.value),
          ]),
        },
      ];
    }
    case "inventory": {
      const d = data as unknown as InventoryReportData;
      return [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Products", String(d.summary.totalProducts)],
            ["Inventory Value", formatCurrency(d.summary.inventoryValue)],
          ],
        },
        {
          name: "Stock Levels",
          headers: ["Product", "SKU", "Category", "Stock", "Value", "Status"],
          rows: d.stockLevels.map((r) => [
            r.name, r.sku, r.category, String(r.currentStock),
            formatCurrency(r.value), r.status,
          ]),
        },
      ];
    }
    case "expenses": {
      const d = data as unknown as ExpenseReportData;
      return [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Expenses", formatCurrency(d.summary.totalExpenses)],
            ["Transactions", String(d.summary.totalTransactions)],
          ],
        },
        {
          name: "By Category",
          headers: ["Category", "Count", "Amount"],
          rows: d.byCategory.map((r) => [r.category, String(r.count), formatCurrency(r.totalAmount)]),
        },
      ];
    }
    case "profit": {
      const d = data as unknown as ProfitReportData;
      return [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Revenue", formatCurrency(d.summary.totalRevenue)],
            ["Cost of Goods", formatCurrency(d.summary.totalCostOfGoods)],
            ["Expenses", formatCurrency(d.summary.totalExpenses)],
            ["Gross Profit", formatCurrency(d.summary.grossProfit)],
            ["Net Profit", formatCurrency(d.summary.netProfit)],
            ["Gross Margin", `${d.summary.grossMargin}%`],
            ["Net Margin", `${d.summary.netMargin}%`],
          ],
        },
        {
          name: "Daily Trend",
          headers: ["Date", "Revenue", "Cost", "Profit"],
          rows: d.dailyTrend.map((r) => [
            r.date, formatCurrency(r.revenue), formatCurrency(r.cost), formatCurrency(r.profit),
          ]),
        },
      ];
    }
    case "revenue": {
      const d = data as unknown as RevenueReportData;
      return [
        {
          name: "Summary",
          headers: ["Metric", "Value"],
          rows: [
            ["Total Revenue", formatCurrency(d.summary.totalRevenue)],
            ["Transactions", String(d.summary.totalTransactions)],
          ],
        },
        {
          name: "Daily Trend",
          headers: ["Date", "Transactions", "Revenue"],
          rows: d.dailyTrend.map((r) => [r.date, String(r.count), formatCurrency(r.revenue)]),
        },
      ];
    }
    default:
      return [];
  }
};

export const reportService = {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getExpenseReport,
  getProfitReport,
  getRevenueReport,
  generateReport,
  getDateRange,
};
