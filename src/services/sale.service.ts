// src/services/sale.service.ts
import { Sale, ISale } from "../models/Sale";
import { Product } from "../models/Product";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { ProductStatus } from "../enums/index";

export const createSale = async (
  shopId: string,
  saleData: Partial<ISale>,
): Promise<ISale> => {
  if (!saleData.items || saleData.items.length === 0) {
    throw new AppError(
      "Sale must contain at least one item",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let subtotal = 0;
  const processedItems = [];

  for (const item of saleData.items) {
    const product = await Product.findOne({
      _id: item.productId,
      shopId,
      isDeleted: false,
    });

    if (!product) {
      throw new AppError(
        `Product with ID ${item.productId} not found`,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (product.currentStock < item.quantity) {
      throw new AppError(
        `Insufficient stock for product: ${product.name}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const itemSubtotal = item.quantity * item.unitPrice;
    subtotal += itemSubtotal;

    processedItems.push({
      productId: product._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: itemSubtotal,
    });

    const newStock = product.currentStock - item.quantity;
    const newStatus =
      newStock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;

    await Product.updateOne(
      { _id: product._id, shopId },
      { $set: { currentStock: newStock, status: newStatus } },
    );
  }

  const discount = saleData.discount || 0;
  const tax = saleData.tax || 0;
  const total = subtotal - discount + tax;

  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const sale = await Sale.create({
    shopId,
    invoiceNumber,
    items: processedItems,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: saleData.paymentMethod,
    customerName: saleData.customerName,
    notes: saleData.notes,
  });

  return sale;
};

export const getSales = async (shopId: string): Promise<ISale[]> => {
  return await Sale.find({ shopId })
    .populate("items.productId", "name sku")
    .sort({ saleDate: -1 });
};

export const getSaleById = async (
  shopId: string,
  saleId: string,
): Promise<ISale> => {
  const sale = await Sale.findOne({ _id: saleId, shopId }).populate(
    "items.productId",
    "name sku brand",
  );

  if (!sale) {
    throw new AppError("Sale not found", HTTP_STATUS.NOT_FOUND);
  }

  return sale;
};
