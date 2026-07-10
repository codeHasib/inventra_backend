"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaleById = exports.getSales = exports.createSale = void 0;
// src/services/sale.service.ts
const Sale_1 = require("../models/Sale");
const Product_1 = require("../models/Product");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
const index_2 = require("../enums/index");
const createSale = async (shopId, saleData) => {
    if (!saleData.items || saleData.items.length === 0) {
        throw new AppError_1.AppError("Sale must contain at least one item", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    let subtotal = 0;
    const processedItems = [];
    for (const item of saleData.items) {
        const product = await Product_1.Product.findOne({
            _id: item.productId,
            shopId,
            isDeleted: false,
        });
        if (!product) {
            throw new AppError_1.AppError(`Product with ID ${item.productId} not found`, index_1.HTTP_STATUS.NOT_FOUND);
        }
        if (product.currentStock < item.quantity) {
            throw new AppError_1.AppError(`Insufficient stock for product: ${product.name}`, index_1.HTTP_STATUS.BAD_REQUEST);
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
        const newStatus = newStock > 0 ? index_2.ProductStatus.ACTIVE : index_2.ProductStatus.OUT_OF_STOCK;
        await Product_1.Product.updateOne({ _id: product._id, shopId }, { $set: { currentStock: newStock, status: newStatus } });
    }
    const discount = saleData.discount || 0;
    const tax = saleData.tax || 0;
    const total = subtotal - discount + tax;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sale = await Sale_1.Sale.create({
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
exports.createSale = createSale;
const getSales = async (shopId) => {
    return await Sale_1.Sale.find({ shopId })
        .populate("items.productId", "name sku")
        .sort({ saleDate: -1 });
};
exports.getSales = getSales;
const getSaleById = async (shopId, saleId) => {
    const sale = await Sale_1.Sale.findOne({ _id: saleId, shopId }).populate("items.productId", "name sku brand");
    if (!sale) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return sale;
};
exports.getSaleById = getSaleById;
//# sourceMappingURL=sale.service.js.map