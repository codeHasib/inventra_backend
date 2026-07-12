import { Purchase, IPurchase } from "../models/Purchase";
import { Product } from "../models/Product";
import { Supplier } from "../models/Supplier";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { ProductStatus, PaymentStatus, PaymentMethod } from "../enums/index";

interface PaginationResult {
  purchases: IPurchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PurchaseStatistics {
  totalPurchases: number;
  todayPurchases: number;
  monthlyPurchases: number;
  totalPurchaseAmount: number;
}

const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PUR-${timestamp}-${random}`;
};

const determineProductStatus = (
  currentStock: number,
  reorderLevel: number,
): ProductStatus => {
  if (currentStock <= 0) return ProductStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return ProductStatus.LOW_STOCK;
  return ProductStatus.ACTIVE;
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

  const newStock = Math.max(0, product.currentStock - quantity);
  const newStatus = determineProductStatus(newStock, product.reorderLevel);

  await Product.updateOne(
    { _id: product._id, shopId },
    { $set: { currentStock: newStock, status: newStatus } },
  );
};

export const createPurchase = async (
  shopId: string,
  data: {
    supplierId: string;
    invoiceNumber?: string;
    purchaseDate?: string;
    items: { productId: string; quantity: number; purchasePrice: number }[];
    discount?: number;
    tax?: number;
    paymentStatus?: PaymentStatus;
    paymentMethod: PaymentMethod;
    notes?: string;
  },
): Promise<IPurchase> => {
  const supplier = await Supplier.findOne({
    _id: data.supplierId,
    shopId,
    isDeleted: false,
  });

  if (!supplier) {
    throw new AppError(
      "Invalid Supplier ID or Supplier does not belong to this shop",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

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
  }

  const invoiceNumber = data.invoiceNumber || generateInvoiceNumber();

  const existingInvoice = await Purchase.findOne({
    shopId,
    invoiceNumber,
    isDeleted: false,
  });

  if (existingInvoice) {
    throw new AppError(
      "A purchase with this invoice number already exists in this shop",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let subtotal = 0;
  const processedItems = data.items.map((item) => {
    const itemTotal = item.quantity * item.purchasePrice;
    subtotal += itemTotal;
    return {
      productId: item.productId as unknown as import("mongoose").Types.ObjectId,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      totalPrice: itemTotal,
    };
  });

  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const total = subtotal - discount + tax;

  const purchase = await Purchase.create({
    shopId,
    supplierId: data.supplierId,
    invoiceNumber,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
    items: processedItems,
    subtotal,
    discount,
    tax,
    total,
    paymentStatus: data.paymentStatus ?? PaymentStatus.PENDING,
    paymentMethod: data.paymentMethod,
    notes: data.notes || "",
  });

  for (const item of data.items) {
    await increaseStock(shopId, item.productId, item.quantity);
  }

  return purchase;
};

export const getPurchases = async (
  shopId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    supplierId?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<PaginationResult> => {
  const { page, limit, search, supplierId, paymentStatus, startDate, endDate } =
    options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { shopId, isDeleted: false };

  if (supplierId) {
    filter.supplierId = supplierId;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filter.purchaseDate = dateFilter;
  }

  if (search) {
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .populate("supplierId", "name company")
      .populate("items.productId", "name sku")
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit),
    Purchase.countDocuments(filter),
  ]);

  return {
    purchases,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAllPurchases = async (shopId: string) => {
  return Purchase.find({ shopId, isDeleted: false })
    .populate("supplierId", "name company")
    .populate("items.productId", "name sku")
    .sort({ purchaseDate: -1 })
    .lean();
};

export const getPurchaseById = async (
  shopId: string,
  purchaseId: string,
): Promise<IPurchase> => {
  const purchase = await Purchase.findOne({
    _id: purchaseId,
    shopId,
    isDeleted: false,
  })
    .populate("supplierId", "name company phone")
    .populate("items.productId", "name sku brand");

  if (!purchase) {
    throw new AppError("Purchase not found", HTTP_STATUS.NOT_FOUND);
  }

  return purchase;
};

export const updatePurchase = async (
  shopId: string,
  purchaseId: string,
  data: {
    supplierId?: string;
    purchaseDate?: string;
    items?: { productId: string; quantity: number; purchasePrice: number }[];
    discount?: number;
    tax?: number;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    notes?: string;
  },
): Promise<IPurchase> => {
  const existing = await Purchase.findOne({
    _id: purchaseId,
    shopId,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError("Purchase not found", HTTP_STATUS.NOT_FOUND);
  }

  if (data.supplierId) {
    const supplier = await Supplier.findOne({
      _id: data.supplierId,
      shopId,
      isDeleted: false,
    });
    if (!supplier) {
      throw new AppError(
        "Invalid Supplier ID or Supplier does not belong to this shop",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  if (data.items) {
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
    }

    for (const oldItem of existing.items) {
      await decreaseStock(
        shopId,
        oldItem.productId.toString(),
        oldItem.quantity,
      );
    }

    for (const newItem of data.items) {
      await increaseStock(shopId, newItem.productId, newItem.quantity);
    }
  }

  const updateFields: Record<string, unknown> = {};

  if (data.supplierId !== undefined) updateFields.supplierId = data.supplierId;
  if (data.purchaseDate !== undefined)
    updateFields.purchaseDate = new Date(data.purchaseDate);
  if (data.paymentStatus !== undefined)
    updateFields.paymentStatus = data.paymentStatus;
  if (data.paymentMethod !== undefined)
    updateFields.paymentMethod = data.paymentMethod;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (data.items !== undefined) {
    let subtotal = 0;
    const processedItems = data.items.map((item) => {
      const itemTotal = item.quantity * item.purchasePrice;
      subtotal += itemTotal;
      return {
        productId: item.productId as unknown as import("mongoose").Types.ObjectId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        totalPrice: itemTotal,
      };
    });

    const discount = data.discount !== undefined ? data.discount : existing.discount;
    const tax = data.tax !== undefined ? data.tax : existing.tax;
    const total = subtotal - discount + tax;

    updateFields.items = processedItems;
    updateFields.subtotal = subtotal;
    updateFields.discount = discount;
    updateFields.tax = tax;
    updateFields.total = total;
  } else if (data.discount !== undefined || data.tax !== undefined) {
    const discount =
      data.discount !== undefined ? data.discount : existing.discount;
    const tax = data.tax !== undefined ? data.tax : existing.tax;
    const total = existing.subtotal - discount + tax;
    updateFields.discount = discount;
    updateFields.tax = tax;
    updateFields.total = total;
  }

  const purchase = await Purchase.findOneAndUpdate(
    { _id: purchaseId, shopId, isDeleted: false },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!purchase) {
    throw new AppError("Purchase not found", HTTP_STATUS.NOT_FOUND);
  }

  return purchase;
};

export const deletePurchase = async (
  shopId: string,
  purchaseId: string,
): Promise<void> => {
  const purchase = await Purchase.findOne({
    _id: purchaseId,
    shopId,
    isDeleted: false,
  });

  if (!purchase) {
    throw new AppError("Purchase not found", HTTP_STATUS.NOT_FOUND);
  }

  for (const item of purchase.items) {
    await decreaseStock(shopId, item.productId.toString(), item.quantity);
  }

  await Purchase.findOneAndUpdate(
    { _id: purchaseId, shopId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true },
  );
};

export const getPurchaseStatistics = async (
  shopId: string,
): Promise<PurchaseStatistics> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseFilter = { shopId, isDeleted: false };

  const [totalPurchases, todayPurchases, monthlyPurchases, amountAggregation] =
    await Promise.all([
      Purchase.countDocuments(baseFilter),
      Purchase.countDocuments({
        ...baseFilter,
        purchaseDate: { $gte: startOfDay },
      }),
      Purchase.countDocuments({
        ...baseFilter,
        purchaseDate: { $gte: startOfMonth },
      }),
      Purchase.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalPurchaseAmount: { $sum: "$total" },
          },
        },
      ]),
    ]);

  const totalPurchaseAmount =
    amountAggregation.length > 0
      ? Number(amountAggregation[0].totalPurchaseAmount.toFixed(2))
      : 0;

  return {
    totalPurchases,
    todayPurchases,
    monthlyPurchases,
    totalPurchaseAmount,
  };
};
