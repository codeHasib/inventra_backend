import { Types } from "mongoose";
import { Product } from "../models/Product";
import { Sale } from "../models/Sale";
import { Purchase } from "../models/Purchase";
import { Category } from "../models/Category";
import { Supplier } from "../models/Supplier";
import { Expense } from "../models/Expense";
import { ProductStatus, PaymentStatus } from "../enums/index";

interface OverviewData {
  inventory: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    inventoryValue: number;
    inventoryCost: number;
    inventoryPotentialRevenue: number;
  };
  sales: {
    todaySales: number;
    weeklySales: number;
    monthlySales: number;
    yearlySales: number;
  };
  revenue: {
    todayRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
  profit: {
    todayProfit: number;
    monthlyProfit: number;
    yearlyProfit: number;
  };
  purchases: {
    totalPurchases: number;
    monthlyPurchases: number;
    purchaseValue: number;
  };
  expenses: {
    totalExpenses: number;
    monthlyExpenses: number;
  };
}

interface RevenueData {
  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  last7Days: { date: string; revenue: number }[];
  last30Days: { date: string; revenue: number }[];
  last12Months: { month: string; revenue: number }[];
}

interface SalesData {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  yearlySales: number;
  salesByPaymentMethod: { method: string; count: number; revenue: number }[];
  salesByStatus: { status: string; count: number }[];
  salesTrend: { date: string; count: number; revenue: number }[];
}

interface InventoryData {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  discontinuedProducts: number;
  inventoryValue: number;
  inventoryCost: number;
  potentialRevenue: number;
  stockByCategory: { category: string; count: number; value: number }[];
  lowStockList: {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    currentStock: number;
    reorderLevel: number;
    status: string;
  }[];
}

interface ChartData {
  last7DaysRevenue: { date: string; revenue: number }[];
  last30DaysRevenue: { date: string; revenue: number }[];
  last12MonthsRevenue: { month: string; revenue: number }[];
  salesTrend: { date: string; count: number; revenue: number }[];
  purchaseTrend: { date: string; count: number; value: number }[];
  expenseTrend: { date: string; count: number; value: number }[];
}

interface TopProductsData {
  topSelling: {
    productId: string;
    productName: string;
    sku: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }[];
  topCategories: {
    categoryId: string;
    categoryName: string;
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
  }[];
  topSuppliers: {
    supplierId: string;
    supplierName: string;
    company: string;
    totalProducts: number;
    totalPurchased: number;
    totalValue: number;
  }[];
  mostProfitable: {
    productId: string;
    productName: string;
    sku: string;
    totalProfit: number;
    totalQuantitySold: number;
  }[];
  slowMoving: {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    totalSold: number;
    daysSinceLastSale: number;
  }[];
  fastMoving: {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    totalSold: number;
    turnoverRate: number;
  }[];
}

interface WarningsData {
  lowStock: {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    currentStock: number;
    reorderLevel: number;
    status: string;
  }[];
  outOfStock: {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    status: string;
  }[];
  expiringSoon: {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    expiryDate: Date | null;
    currentStock: number;
  }[];
  withoutSupplier: {
    _id: Types.ObjectId;
    name: string;
    sku: string;
  }[];
  inactive: {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    status: string;
    isActive: boolean;
  }[];
}

const round = (val: number): number => Number(val.toFixed(2));

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date): Date => {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
};

const startOfMonth = (date: Date): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const startOfYear = (date: Date): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
};

const getOverview = async (shopId: string): Promise<OverviewData> => {
  const oid = new Types.ObjectId(shopId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [
    inventoryAgg,
    salesToday,
    salesWeekly,
    salesMonthly,
    salesYearly,
    revenueAgg,
    profitAgg,
    purchaseAgg,
    expenseAgg,
  ] = await Promise.all([
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
          inventoryValue: {
            $sum: { $multiply: ["$currentStock", "$sellingPrice"] },
          },
          inventoryCost: {
            $sum: { $multiply: ["$currentStock", "$purchasePrice"] },
          },
        },
      },
    ]),
    Sale.countDocuments({
      shopId: oid,
      isDeleted: false,
      paymentStatus: { $ne: PaymentStatus.REFUNDED },
      saleDate: { $gte: todayStart },
    }),
    Sale.countDocuments({
      shopId: oid,
      isDeleted: false,
      paymentStatus: { $ne: PaymentStatus.REFUNDED },
      saleDate: { $gte: weekStart },
    }),
    Sale.countDocuments({
      shopId: oid,
      isDeleted: false,
      paymentStatus: { $ne: PaymentStatus.REFUNDED },
      saleDate: { $gte: monthStart },
    }),
    Sale.countDocuments({
      shopId: oid,
      isDeleted: false,
      paymentStatus: { $ne: PaymentStatus.REFUNDED },
      saleDate: { $gte: yearStart },
    }),
    Sale.aggregate([
      {
        $match: {
          shopId: oid,
          isDeleted: false,
          paymentStatus: { $ne: PaymentStatus.REFUNDED },
        },
      },
      {
        $group: {
          _id: null,
          todayRevenue: {
            $sum: {
              $cond: [{ $gte: ["$saleDate", todayStart] }, "$grandTotal", 0],
            },
          },
          monthlyRevenue: {
            $sum: {
              $cond: [{ $gte: ["$saleDate", monthStart] }, "$grandTotal", 0],
            },
          },
          yearlyRevenue: {
            $sum: {
              $cond: [{ $gte: ["$saleDate", yearStart] }, "$grandTotal", 0],
            },
          },
        },
      },
    ]),
    Sale.aggregate([
      {
        $match: {
          shopId: oid,
          isDeleted: false,
          paymentStatus: { $ne: PaymentStatus.REFUNDED },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          todayProfit: {
            $sum: {
              $cond: [
                { $gte: ["$saleDate", todayStart] },
                { $multiply: ["$items.profitPerUnit", "$items.quantity"] },
                0,
              ],
            },
          },
          monthlyProfit: {
            $sum: {
              $cond: [
                { $gte: ["$saleDate", monthStart] },
                { $multiply: ["$items.profitPerUnit", "$items.quantity"] },
                0,
              ],
            },
          },
          yearlyProfit: {
            $sum: {
              $cond: [
                { $gte: ["$saleDate", yearStart] },
                { $multiply: ["$items.profitPerUnit", "$items.quantity"] },
                0,
              ],
            },
          },
        },
      },
    ]),
    Purchase.aggregate([
      { $match: { shopId: oid, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          monthlyPurchases: {
            $sum: {
              $cond: [{ $gte: ["$purchaseDate", monthStart] }, 1, 0],
            },
          },
          purchaseValue: { $sum: "$total" },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { shopId: oid } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          monthlyExpenses: {
            $sum: {
              $cond: [{ $gte: ["$expenseDate", monthStart] }, "$amount", 0],
            },
          },
        },
      },
    ]),
  ]);

  const inv = inventoryAgg[0] || {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    inventoryValue: 0,
    inventoryCost: 0,
  };
  const rev = revenueAgg[0] || { todayRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0 };
  const prof = profitAgg[0] || { todayProfit: 0, monthlyProfit: 0, yearlyProfit: 0 };
  const purch = purchaseAgg[0] || { totalPurchases: 0, monthlyPurchases: 0, purchaseValue: 0 };
  const exp = expenseAgg[0] || { totalExpenses: 0, monthlyExpenses: 0 };

  return {
    inventory: {
      totalProducts: inv.totalProducts,
      activeProducts: inv.activeProducts,
      lowStockProducts: inv.lowStockProducts,
      outOfStockProducts: inv.outOfStockProducts,
      inventoryValue: round(inv.inventoryValue),
      inventoryCost: round(inv.inventoryCost),
      inventoryPotentialRevenue: round(inv.inventoryValue),
    },
    sales: {
      todaySales: salesToday,
      weeklySales: salesWeekly,
      monthlySales: salesMonthly,
      yearlySales: salesYearly,
    },
    revenue: {
      todayRevenue: round(rev.todayRevenue),
      monthlyRevenue: round(rev.monthlyRevenue),
      yearlyRevenue: round(rev.yearlyRevenue),
    },
    profit: {
      todayProfit: round(prof.todayProfit),
      monthlyProfit: round(prof.monthlyProfit),
      yearlyProfit: round(prof.yearlyProfit),
    },
    purchases: {
      totalPurchases: purch.totalPurchases,
      monthlyPurchases: purch.monthlyPurchases,
      purchaseValue: round(purch.purchaseValue),
    },
    expenses: {
      totalExpenses: round(exp.totalExpenses),
      monthlyExpenses: round(exp.monthlyExpenses),
    },
  };
};

const getRevenue = async (shopId: string): Promise<RevenueData> => {
  const oid = new Types.ObjectId(shopId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [todayAgg, monthlyAgg, yearlyAgg, last7Days, last30Days, last12Months] =
    await Promise.all([
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: todayStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: yearStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: { $round: ["$revenue", 2] } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: { $round: ["$revenue", 2] } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: "$_id", revenue: { $round: ["$revenue", 2] } } },
      ]),
    ]);

  return {
    todayRevenue: round(todayAgg[0]?.total || 0),
    monthlyRevenue: round(monthlyAgg[0]?.total || 0),
    yearlyRevenue: round(yearlyAgg[0]?.total || 0),
    last7Days,
    last30Days,
    last12Months,
  };
};

const getSales = async (shopId: string): Promise<SalesData> => {
  const oid = new Types.ObjectId(shopId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [todayCount, weeklyCount, monthlyCount, yearlyCount, byMethod, byStatus, trend] =
    await Promise.all([
      Sale.countDocuments({
        shopId: oid,
        isDeleted: false,
        paymentStatus: { $ne: PaymentStatus.REFUNDED },
        saleDate: { $gte: todayStart },
      }),
      Sale.countDocuments({
        shopId: oid,
        isDeleted: false,
        paymentStatus: { $ne: PaymentStatus.REFUNDED },
        saleDate: { $gte: weekStart },
      }),
      Sale.countDocuments({
        shopId: oid,
        isDeleted: false,
        paymentStatus: { $ne: PaymentStatus.REFUNDED },
        saleDate: { $gte: monthStart },
      }),
      Sale.countDocuments({
        shopId: oid,
        isDeleted: false,
        paymentStatus: { $ne: PaymentStatus.REFUNDED },
        saleDate: { $gte: yearStart },
      }),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
          },
        },
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
        { $match: { shopId: oid, isDeleted: false } },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            count: { $sum: 1 },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: 1,
            revenue: { $round: ["$revenue", 2] },
          },
        },
      ]),
    ]);

  return {
    todaySales: todayCount,
    weeklySales: weeklyCount,
    monthlySales: monthlyCount,
    yearlySales: yearlyCount,
    salesByPaymentMethod: byMethod,
    salesByStatus: byStatus,
    salesTrend: trend,
  };
};

const getInventory = async (shopId: string): Promise<InventoryData> => {
  const oid = new Types.ObjectId(shopId);

  const [statusAgg, categoryAgg, lowStockList] = await Promise.all([
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
          inventoryValue: {
            $sum: { $multiply: ["$currentStock", "$sellingPrice"] },
          },
          inventoryCost: {
            $sum: { $multiply: ["$currentStock", "$purchasePrice"] },
          },
        },
      },
    ]),
    Product.aggregate([
      { $match: { shopId: oid, isDeleted: false } },
      {
        $group: {
          _id: "$categoryId",
          totalValue: {
            $sum: { $multiply: ["$currentStock", "$sellingPrice"] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: { $ifNull: ["$category.name", "Uncategorized"] },
          totalProducts: "$count",
          value: { $round: ["$totalValue", 2] },
        },
      },
      { $sort: { value: -1 } },
    ]),
    Product.find({
      shopId: oid,
      isDeleted: false,
      $or: [
        { status: ProductStatus.LOW_STOCK },
        { status: ProductStatus.OUT_OF_STOCK },
      ],
    })
      .select("name sku currentStock reorderLevel status")
      .sort({ currentStock: 1 })
      .limit(20)
      .lean(),
  ]);

  const inv = statusAgg[0] || {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    discontinuedProducts: 0,
    inventoryValue: 0,
    inventoryCost: 0,
  };

  return {
    totalProducts: inv.totalProducts,
    activeProducts: inv.activeProducts,
    lowStockProducts: inv.lowStockProducts,
    outOfStockProducts: inv.outOfStockProducts,
    discontinuedProducts: inv.discontinuedProducts,
    inventoryValue: round(inv.inventoryValue),
    inventoryCost: round(inv.inventoryCost),
    potentialRevenue: round(inv.inventoryValue),
    stockByCategory: categoryAgg,
    lowStockList,
  };
};

const getCharts = async (shopId: string): Promise<ChartData> => {
  const oid = new Types.ObjectId(shopId);
  const now = new Date();

  const [last7DaysRevenue, last30DaysRevenue, last12MonthsRevenue, salesTrend, purchaseTrend, expenseTrend] =
    await Promise.all([
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: { $round: ["$revenue", 2] } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", revenue: { $round: ["$revenue", 2] } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$saleDate" } },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: "$_id", revenue: { $round: ["$revenue", 2] } } },
      ]),
      Sale.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            paymentStatus: { $ne: PaymentStatus.REFUNDED },
            saleDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
            count: { $sum: 1 },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: 1,
            revenue: { $round: ["$revenue", 2] },
          },
        },
      ]),
      Purchase.aggregate([
        {
          $match: {
            shopId: oid,
            isDeleted: false,
            purchaseDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
            count: { $sum: 1 },
            value: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: 1,
            value: { $round: ["$value", 2] },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            shopId: oid,
            expenseDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" } },
            count: { $sum: 1 },
            value: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            count: 1,
            value: { $round: ["$value", 2] },
          },
        },
      ]),
    ]);

  return {
    last7DaysRevenue,
    last30DaysRevenue,
    last12MonthsRevenue,
    salesTrend,
    purchaseTrend,
    expenseTrend,
  };
};

const getTopProducts = async (
  shopId: string,
  limit: number,
): Promise<TopProductsData> => {
  const oid = new Types.ObjectId(shopId);
  const now = new Date();

  const [topSelling, topCategories, topSuppliers, mostProfitable, slowMoving, fastMoving] =
    await Promise.all([
      Sale.aggregate([
        { $match: { shopId: oid, isDeleted: false, paymentStatus: { $ne: PaymentStatus.REFUNDED } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            sku: { $first: "$items.sku" },
            totalQuantitySold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: "$items.total" },
          },
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            productName: 1,
            sku: 1,
            totalQuantitySold: 1,
            totalRevenue: { $round: ["$totalRevenue", 2] },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { shopId: oid, isDeleted: false, paymentStatus: { $ne: PaymentStatus.REFUNDED } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "product.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$product.categoryId",
            categoryName: { $first: { $ifNull: ["$category.name", "Uncategorized"] } },
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: "$items.total" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            categoryId: { $ifNull: ["$_id", "unknown"] },
            categoryName: 1,
            totalProducts: "$totalSold",
            totalSold: 1,
            totalRevenue: { $round: ["$totalRevenue", 2] },
          },
        },
      ]),
      Purchase.aggregate([
        { $match: { shopId: oid, isDeleted: false } },
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
            totalPurchased: { $sum: 1 },
            totalValue: { $sum: "$total" },
          },
        },
        { $sort: { totalValue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            supplierId: "$_id",
            supplierName: 1,
            company: 1,
            totalProducts: "$totalPurchased",
            totalPurchased: 1,
            totalValue: { $round: ["$totalValue", 2] },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { shopId: oid, isDeleted: false, paymentStatus: { $ne: PaymentStatus.REFUNDED } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            productName: { $first: "$items.productName" },
            sku: { $first: "$items.sku" },
            totalProfit: {
              $sum: { $multiply: ["$items.profitPerUnit", "$items.quantity"] },
            },
            totalQuantitySold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalProfit: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            productName: 1,
            sku: 1,
            totalProfit: { $round: ["$totalProfit", 2] },
            totalQuantitySold: 1,
          },
        },
      ]),
      (async () => {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const soldProducts = await Sale.aggregate([
          { $match: { shopId: oid, isDeleted: false, paymentStatus: { $ne: PaymentStatus.REFUNDED } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              totalSold: { $sum: "$items.quantity" },
              lastSaleDate: { $max: "$saleDate" },
            },
          },
        ]);

        const soldMap = new Map<string, { totalSold: number; lastSaleDate: Date }>();
        for (const doc of soldProducts) {
          soldMap.set(doc._id.toString(), {
            totalSold: doc.totalSold,
            lastSaleDate: doc.lastSaleDate,
          });
        }

        const allProducts = await Product.find({
          shopId: oid,
          isDeleted: false,
          status: { $ne: ProductStatus.OUT_OF_STOCK },
        })
          .select("name sku currentStock")
          .lean();

        const slowMovingProducts = allProducts
          .map((p) => {
            const sold = soldMap.get(p._id.toString());
            const daysSince = sold
              ? Math.floor(
                  (now.getTime() - new Date(sold.lastSaleDate).getTime()) /
                    (24 * 60 * 60 * 1000),
                )
              : 999;
            return {
              productId: p._id.toString(),
              productName: p.name,
              sku: p.sku,
              currentStock: p.currentStock,
              totalSold: sold?.totalSold || 0,
              daysSinceLastSale: daysSince,
            };
          })
          .sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale)
          .slice(0, limit);

        return slowMovingProducts;
      })(),
      (async () => {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const soldProducts = await Sale.aggregate([
          {
            $match: {
              shopId: oid,
              isDeleted: false,
              paymentStatus: { $ne: PaymentStatus.REFUNDED },
              saleDate: { $gte: thirtyDaysAgo },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              productName: { $first: "$items.productName" },
              sku: { $first: "$items.sku" },
              totalSold: { $sum: "$items.quantity" },
            },
          },
        ]);

        const productIds = soldProducts.map(
          (p) => new Types.ObjectId(p._id),
        );

        const products =
          productIds.length > 0
            ? await Product.find({
                _id: { $in: productIds },
                shopId: oid,
                isDeleted: false,
              })
                .select("name sku currentStock")
                .lean()
            : [];

        const productMap = new Map<string, { name: string; sku: string; stock: number }>();
        for (const p of products) {
          productMap.set(p._id.toString(), {
            name: p.name,
            sku: p.sku,
            stock: p.currentStock,
          });
        }

        return soldProducts
          .map((sp) => {
            const prod = productMap.get(sp._id.toString());
            const turnoverRate = prod
              ? sp.totalSold / (prod.stock || 1)
              : 0;
            return {
              productId: sp._id.toString(),
              productName: prod?.name || sp.productName,
              sku: prod?.sku || sp.sku,
              currentStock: prod?.stock || 0,
              totalSold: sp.totalSold,
              turnoverRate: round(turnoverRate),
            };
          })
          .sort((a, b) => b.turnoverRate - a.turnoverRate)
          .slice(0, limit);
      })(),
    ]);

  return {
    topSelling,
    topCategories,
    topSuppliers,
    mostProfitable,
    slowMoving,
    fastMoving,
  };
};

const getWarnings = async (shopId: string): Promise<WarningsData> => {
  const oid = new Types.ObjectId(shopId);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [lowStock, outOfStock, expiringSoon, withoutSupplier, inactive] =
    await Promise.all([
      Product.find({
        shopId: oid,
        isDeleted: false,
        status: ProductStatus.LOW_STOCK,
      })
        .select("name sku currentStock reorderLevel status")
        .sort({ currentStock: 1 })
        .lean(),
      Product.find({
        shopId: oid,
        isDeleted: false,
        status: ProductStatus.OUT_OF_STOCK,
      })
        .select("name sku status")
        .lean(),
      Product.find({
        shopId: oid,
        isDeleted: false,
        expiryDate: { $ne: null, $lte: thirtyDaysFromNow, $gte: now },
      })
        .select("name sku expiryDate currentStock")
        .sort({ expiryDate: 1 })
        .lean(),
      Product.find({
        shopId: oid,
        isDeleted: false,
        supplierId: { $exists: false },
      })
        .select("name sku")
        .lean(),
      Product.find({
        shopId: oid,
        isDeleted: false,
        $or: [
          { isActive: false },
          { status: ProductStatus.DISCONTINUED },
        ],
      })
        .select("name sku status isActive")
        .lean(),
    ]);

  return {
    lowStock,
    outOfStock,
    expiringSoon,
    withoutSupplier,
    inactive,
  };
};

export const dashboardService = {
  getOverview,
  getRevenue,
  getSales,
  getInventory,
  getCharts,
  getTopProducts,
  getWarnings,
};
