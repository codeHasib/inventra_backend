"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopProducts = exports.getSaleStatistics = exports.refundSale = exports.deleteSale = exports.updateSale = exports.getSaleById = exports.getSales = exports.createSale = void 0;
const mongoose_1 = require("mongoose");
const Sale_1 = require("../models/Sale");
const Product_1 = require("../models/Product");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
const index_2 = require("../enums/index");
const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${timestamp}-${random}`;
};
const determineProductStatus = (currentStock, reorderLevel) => {
    if (currentStock <= 0)
        return index_2.ProductStatus.OUT_OF_STOCK;
    if (currentStock <= reorderLevel)
        return index_2.ProductStatus.LOW_STOCK;
    return index_2.ProductStatus.ACTIVE;
};
const decreaseStock = async (shopId, productId, quantity) => {
    const product = await Product_1.Product.findOne({
        _id: productId,
        shopId,
        isDeleted: false,
    });
    if (!product) {
        throw new AppError_1.AppError(`Product with ID ${productId} not found or does not belong to this shop`, index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (product.currentStock < quantity) {
        throw new AppError_1.AppError(`Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${quantity}`, index_1.HTTP_STATUS.BAD_REQUEST);
    }
    const newStock = product.currentStock - quantity;
    const newStatus = determineProductStatus(newStock, product.reorderLevel);
    await Product_1.Product.updateOne({ _id: product._id, shopId }, { $set: { currentStock: newStock, status: newStatus } });
};
const increaseStock = async (shopId, productId, quantity) => {
    const product = await Product_1.Product.findOne({
        _id: productId,
        shopId,
        isDeleted: false,
    });
    if (!product) {
        throw new AppError_1.AppError(`Product with ID ${productId} not found or does not belong to this shop`, index_1.HTTP_STATUS.NOT_FOUND);
    }
    const newStock = product.currentStock + quantity;
    const newStatus = determineProductStatus(newStock, product.reorderLevel);
    await Product_1.Product.updateOne({ _id: product._id, shopId }, { $set: { currentStock: newStock, status: newStatus } });
};
const createSale = async (shopId, data) => {
    const processedItems = [];
    let subtotal = 0;
    for (const item of data.items) {
        const product = await Product_1.Product.findOne({
            _id: item.productId,
            shopId,
            isDeleted: false,
        });
        if (!product) {
            throw new AppError_1.AppError(`Product with ID ${item.productId} not found or does not belong to this shop`, index_1.HTTP_STATUS.NOT_FOUND);
        }
        if (product.currentStock < item.quantity) {
            throw new AppError_1.AppError(`Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`, index_1.HTTP_STATUS.BAD_REQUEST);
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
    const sale = await Sale_1.Sale.create({
        shopId,
        invoiceNumber,
        items: processedItems,
        subtotal,
        discount,
        tax,
        grandTotal,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus ?? index_2.PaymentStatus.PAID,
        customerName: data.customerName || "Walk-in Customer",
        customerPhone: data.customerPhone || "",
        notes: data.notes || "",
        saleDate: new Date(),
    });
    for (const item of processedItems) {
        await decreaseStock(shopId, item.productId.toString(), item.quantity);
    }
    return sale;
};
exports.createSale = createSale;
const getSales = async (shopId, options) => {
    const { page, limit, search, paymentMethod, paymentStatus, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    const filter = { shopId, isDeleted: false };
    if (paymentMethod) {
        filter.paymentMethod = paymentMethod;
    }
    if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
        const dateFilter = {};
        if (startDate)
            dateFilter.$gte = new Date(startDate);
        if (endDate)
            dateFilter.$lte = new Date(endDate);
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
        Sale_1.Sale.find(filter)
            .sort({ saleDate: -1 })
            .skip(skip)
            .limit(limit),
        Sale_1.Sale.countDocuments(filter),
    ]);
    return {
        sales,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getSales = getSales;
const getSaleById = async (shopId, saleId) => {
    const sale = await Sale_1.Sale.findOne({
        _id: saleId,
        shopId,
        isDeleted: false,
    });
    if (!sale) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return sale;
};
exports.getSaleById = getSaleById;
const updateSale = async (shopId, saleId, data) => {
    const existing = await Sale_1.Sale.findOne({
        _id: saleId,
        shopId,
        isDeleted: false,
    });
    if (!existing) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    const updateFields = {};
    if (data.customerName !== undefined)
        updateFields.customerName = data.customerName;
    if (data.customerPhone !== undefined)
        updateFields.customerPhone = data.customerPhone;
    if (data.paymentMethod !== undefined)
        updateFields.paymentMethod = data.paymentMethod;
    if (data.paymentStatus !== undefined)
        updateFields.paymentStatus = data.paymentStatus;
    if (data.notes !== undefined)
        updateFields.notes = data.notes;
    const sale = await Sale_1.Sale.findOneAndUpdate({ _id: saleId, shopId, isDeleted: false }, { $set: updateFields }, { new: true, runValidators: true });
    if (!sale) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return sale;
};
exports.updateSale = updateSale;
const deleteSale = async (shopId, saleId) => {
    const sale = await Sale_1.Sale.findOne({
        _id: saleId,
        shopId,
        isDeleted: false,
    });
    if (!sale) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (sale.paymentStatus === index_2.PaymentStatus.REFUNDED) {
        throw new AppError_1.AppError("Cannot delete a refunded sale", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    for (const item of sale.items) {
        await increaseStock(shopId, item.productId.toString(), item.quantity);
    }
    await Sale_1.Sale.findOneAndUpdate({ _id: saleId, shopId, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });
};
exports.deleteSale = deleteSale;
const refundSale = async (shopId, saleId) => {
    const sale = await Sale_1.Sale.findOne({
        _id: saleId,
        shopId,
        isDeleted: false,
    });
    if (!sale) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (sale.paymentStatus === index_2.PaymentStatus.REFUNDED) {
        throw new AppError_1.AppError("This sale has already been refunded", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    for (const item of sale.items) {
        await increaseStock(shopId, item.productId.toString(), item.quantity);
    }
    const updatedSale = await Sale_1.Sale.findOneAndUpdate({ _id: saleId, shopId, isDeleted: false }, { $set: { paymentStatus: index_2.PaymentStatus.REFUNDED } }, { new: true, runValidators: true });
    if (!updatedSale) {
        throw new AppError_1.AppError("Sale not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return updatedSale;
};
exports.refundSale = refundSale;
const getSaleStatistics = async (shopId, startDate, endDate) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const baseFilter = {
        shopId,
        isDeleted: false,
        paymentStatus: { $ne: index_2.PaymentStatus.REFUNDED },
    };
    const dateFilter = {};
    if (startDate)
        dateFilter.$gte = new Date(startDate);
    if (endDate)
        dateFilter.$lte = new Date(endDate);
    const hasCustomDate = startDate || endDate;
    const periodFilter = hasCustomDate
        ? { ...baseFilter, saleDate: dateFilter }
        : baseFilter;
    const [totalSales, todaySales, monthlySales, revenueAggregation] = await Promise.all([
        Sale_1.Sale.countDocuments(baseFilter),
        Sale_1.Sale.countDocuments({
            ...baseFilter,
            saleDate: { $gte: startOfDay },
        }),
        Sale_1.Sale.countDocuments({
            ...baseFilter,
            saleDate: { $gte: startOfMonth },
        }),
        Sale_1.Sale.aggregate([
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
    const totalRevenue = revenueAggregation.length > 0
        ? Number(revenueAggregation[0].totalRevenue.toFixed(2))
        : 0;
    const averageSaleValue = revenueAggregation.length > 0 && revenueAggregation[0].count > 0
        ? Number((revenueAggregation[0].totalRevenue / revenueAggregation[0].count).toFixed(2))
        : 0;
    return {
        totalSales,
        todaySales,
        monthlySales,
        totalRevenue,
        averageSaleValue,
    };
};
exports.getSaleStatistics = getSaleStatistics;
const getTopProducts = async (shopId, options) => {
    const { limit, startDate, endDate } = options;
    const matchStage = {
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
        paymentStatus: { $ne: index_2.PaymentStatus.REFUNDED },
    };
    if (startDate || endDate) {
        const dateFilter = {};
        if (startDate)
            dateFilter.$gte = new Date(startDate);
        if (endDate)
            dateFilter.$lte = new Date(endDate);
        matchStage.saleDate = dateFilter;
    }
    const results = await Sale_1.Sale.aggregate([
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
exports.getTopProducts = getTopProducts;
//# sourceMappingURL=sale.service.js.map