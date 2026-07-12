import { Types } from "mongoose";
import { Sale, ISale } from "../models/Sale";
import { Product } from "../models/Product";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { ProductStatus, PaymentStatus, PaymentMethod } from "../enums/index";

interface PaginationResult {
  sales: ISale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SaleStatistics {
  totalSales: number;
  todaySales: number;
  monthlySales: number;
  totalRevenue: number;
  averageSaleValue: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

const determineProductStatus = (
  currentStock: number,
  reorderLevel: number,
): ProductStatus => {
  if (currentStock <= 0) return ProductStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return ProductStatus.LOW_STOCK;
  return ProductStatus.ACTIVE;
};

const decreaseStock = async (
  shopId: string,
  productId: string,
  quantity: number,
): Promise<void> => {
  const product = await Product.findOne({
    _id: productId,
    shopId,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError(
      `Product with ID ${productId} not found or does not belong to this shop`,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (product.currentStock < quantity) {
    throw new AppError(
      `Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${quantity}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const newStock = product.currentStock - quantity;
  const newStatus = determineProductStatus(newStock, product.reorderLevel);

  await Product.updateOne(
    { _id: product._id, shopId },
    { $set: { currentStock: newStock, status: newStatus } },
  );
};

const increaseStock = async (
  shopId: string,
  productId: string,
  quantity: number,
): Promise<void> => {
  const product = await Product.findOne({
    _id: productId,
    shopId,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError(
      `Product with ID ${productId} not found or does not belong to this shop`,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  const newStock = product.currentStock + quantity;
  const newStatus = determineProductStatus(newStock, product.reorderLevel);

  await Product.updateOne(
    { _id: product._id, shopId },
    { $set: { currentStock: newStock, status: newStatus } },
  );
};

export const createSale = async (
  shopId: string,
  data: {
    items: { productId: string; quantity: number; unitPrice: number }[];
    discount?: number;
    tax?: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  },
): Promise<ISale> => {
  const processedItems: {
    productId: import("mongoose").Types.ObjectId;
    productName: string;
    sku: string;
    barcode: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    profitPerUnit: number;
    total: number;
  }[] = [];

  let subtotal = 0;

  for (const item of data.items) {
    const product = await Product.findOne({
      _id: item.productId,
      shopId,
      isDeleted: false,
    });

    if (!product) {
      throw new AppError(
        `Product with ID ${item.productId} not found or does not belong to this shop`,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (product.currentStock < item.quantity) {
      throw new AppError(
        `Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const sellingPrice = item.unitPrice || product.sellingPrice;
    const profitPerUnit = sellingPrice - product.purchasePrice;
    const itemTotal = item.quantity * sellingPrice;

    processedItems.push({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      quantity: item.quantity,
      purchasePrice: product.purchasePrice,
      sellingPrice,
      profitPerUnit,
      total: itemTotal,
    });

    subtotal += itemTotal;
  }

  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const grandTotal = subtotal - discount + tax;

  const invoiceNumber = generateInvoiceNumber();

  const sale = await Sale.create({
    shopId,
    invoiceNumber,
    items: processedItems,
    subtotal,
    discount,
    tax,
    grandTotal,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus ?? PaymentStatus.PAID,
    customerName: data.customerName || "Walk-in Customer",
    customerPhone: data.customerPhone || "",
    notes: data.notes || "",
    saleDate: new Date(),
  });

  for (const item of processedItems) {
    await decreaseStock(
      shopId,
      item.productId.toString(),
      item.quantity,
    );
  }

  return sale;
};

export const getSales = async (
  shopId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<PaginationResult> => {
  const { page, limit, search, paymentMethod, paymentStatus, startDate, endDate } =
    options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { shopId, isDeleted: false };

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filter.saleDate = dateFilter;
  }

  if (search) {
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { customerPhone: { $regex: search, $options: "i" } },
      { "items.productName": { $regex: search, $options: "i" } },
    ];
  }

  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(limit),
    Sale.countDocuments(filter),
  ]);

  return {
    sales,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAllSales = async (shopId: string) => {
  return Sale.find({ shopId, isDeleted: false })
    .sort({ saleDate: -1 })
    .lean();
};

export const getSaleById = async (
  shopId: string,
  saleId: string,
): Promise<ISale> => {
  const sale = await Sale.findOne({
    _id: saleId,
    shopId,
    isDeleted: false,
  });

  if (!sale) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  return sale;
};

export const updateSale = async (
  shopId: string,
  saleId: string,
  data: {
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    notes?: string;
  },
): Promise<ISale> => {
  const existing = await Sale.findOne({
    _id: saleId,
    shopId,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  const updateFields: Record<string, unknown> = {};

  if (data.customerName !== undefined) updateFields.customerName = data.customerName;
  if (data.customerPhone !== undefined) updateFields.customerPhone = data.customerPhone;
  if (data.paymentMethod !== undefined) updateFields.paymentMethod = data.paymentMethod;
  if (data.paymentStatus !== undefined) updateFields.paymentStatus = data.paymentStatus;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  const sale = await Sale.findOneAndUpdate(
    { _id: saleId, shopId, isDeleted: false },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!sale) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  return sale;
};

export const deleteSale = async (
  shopId: string,
  saleId: string,
): Promise<void> => {
  const sale = await Sale.findOne({
    _id: saleId,
    shopId,
    isDeleted: false,
  });

  if (!sale) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  if (sale.paymentStatus === PaymentStatus.REFUNDED) {
    throw new AppError(
      "Cannot delete a refunded sale",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  for (const item of sale.items) {
    await increaseStock(
      shopId,
      item.productId.toString(),
      item.quantity,
    );
  }

  await Sale.findOneAndUpdate(
    { _id: saleId, shopId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true },
  );
};

export const refundSale = async (
  shopId: string,
  saleId: string,
): Promise<ISale> => {
  const sale = await Sale.findOne({
    _id: saleId,
    shopId,
    isDeleted: false,
  });

  if (!sale) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  if (sale.paymentStatus === PaymentStatus.REFUNDED) {
    throw new AppError(
      "This sale has already been refunded",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  for (const item of sale.items) {
    await increaseStock(
      shopId,
      item.productId.toString(),
      item.quantity,
    );
  }

  const updatedSale = await Sale.findOneAndUpdate(
    { _id: saleId, shopId, isDeleted: false },
    { $set: { paymentStatus: PaymentStatus.REFUNDED } },
    { new: true, runValidators: true },
  );

  if (!updatedSale) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  return updatedSale;
};

export const getSaleStatistics = async (
  shopId: string,
  startDate?: string,
  endDate?: string,
): Promise<SaleStatistics> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseFilter: Record<string, unknown> = {
    shopId,
    isDeleted: false,
    paymentStatus: { $ne: PaymentStatus.REFUNDED },
  };

  const dateFilter: Record<string, unknown> = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const hasCustomDate = startDate || endDate;
  const periodFilter = hasCustomDate
    ? { ...baseFilter, saleDate: dateFilter }
    : baseFilter;

  const [totalSales, todaySales, monthlySales, revenueAggregation] =
    await Promise.all([
      Sale.countDocuments(baseFilter),
      Sale.countDocuments({
        ...baseFilter,
        saleDate: { $gte: startOfDay },
      }),
      Sale.countDocuments({
        ...baseFilter,
        saleDate: { $gte: startOfMonth },
      }),
      Sale.aggregate([
        { $match: periodFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$grandTotal" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const totalRevenue =
    revenueAggregation.length > 0
      ? Number(revenueAggregation[0].totalRevenue.toFixed(2))
      : 0;

  const averageSaleValue =
    revenueAggregation.length > 0 && revenueAggregation[0].count > 0
      ? Number(
          (
            revenueAggregation[0].totalRevenue / revenueAggregation[0].count
          ).toFixed(2),
        )
      : 0;

  return {
    totalSales,
    todaySales,
    monthlySales,
    totalRevenue,
    averageSaleValue,
  };
};

export const getTopProducts = async (
  shopId: string,
  options: {
    limit: number;
    startDate?: string;
    endDate?: string;
  },
): Promise<TopProduct[]> => {
  const { limit, startDate, endDate } = options;

  const matchStage: Record<string, unknown> = {
    shopId: new Types.ObjectId(shopId),
    isDeleted: false,
    paymentStatus: { $ne: PaymentStatus.REFUNDED },
  };

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    matchStage.saleDate = dateFilter;
  }

  const results = await Sale.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        productName: { $first: "$items.productName" },
        sku: { $first: "$items.sku" },
        totalQuantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.total" },
        totalProfit: {
          $sum: {
            $multiply: ["$items.profitPerUnit", "$items.quantity"],
          },
        },
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
        totalProfit: { $round: ["$totalProfit", 2] },
      },
    },
  ]);

  return results;
};
