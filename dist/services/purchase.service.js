"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseStatistics = exports.deletePurchase = exports.updatePurchase = exports.getPurchaseById = exports.getAllPurchases = exports.getPurchases = exports.createPurchase = void 0;
const Purchase_1 = require("../models/Purchase");
const Product_1 = require("../models/Product");
const Supplier_1 = require("../models/Supplier");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
const index_2 = require("../enums/index");
const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PUR-${timestamp}-${random}`;
};
const determineProductStatus = (currentStock, reorderLevel) => {
    if (currentStock <= 0)
        return index_2.ProductStatus.OUT_OF_STOCK;
    if (currentStock <= reorderLevel)
        return index_2.ProductStatus.LOW_STOCK;
    return index_2.ProductStatus.ACTIVE;
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
const decreaseStock = async (shopId, productId, quantity) => {
    const product = await Product_1.Product.findOne({
        _id: productId,
        shopId,
        isDeleted: false,
    });
    if (!product) {
        throw new AppError_1.AppError(`Product with ID ${productId} not found or does not belong to this shop`, index_1.HTTP_STATUS.NOT_FOUND);
    }
    const newStock = Math.max(0, product.currentStock - quantity);
    const newStatus = determineProductStatus(newStock, product.reorderLevel);
    await Product_1.Product.updateOne({ _id: product._id, shopId }, { $set: { currentStock: newStock, status: newStatus } });
};
const createPurchase = async (shopId, data) => {
    const supplier = await Supplier_1.Supplier.findOne({
        _id: data.supplierId,
        shopId,
        isDeleted: false,
    });
    if (!supplier) {
        throw new AppError_1.AppError("Invalid Supplier ID or Supplier does not belong to this shop", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    for (const item of data.items) {
        const product = await Product_1.Product.findOne({
            _id: item.productId,
            shopId,
            isDeleted: false,
        });
        if (!product) {
            throw new AppError_1.AppError(`Product with ID ${item.productId} not found or does not belong to this shop`, index_1.HTTP_STATUS.NOT_FOUND);
        }
    }
    const invoiceNumber = data.invoiceNumber || generateInvoiceNumber();
    const existingInvoice = await Purchase_1.Purchase.findOne({
        shopId,
        invoiceNumber,
        isDeleted: false,
    });
    if (existingInvoice) {
        throw new AppError_1.AppError("A purchase with this invoice number already exists in this shop", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    let subtotal = 0;
    const processedItems = data.items.map((item) => {
        const itemTotal = item.quantity * item.purchasePrice;
        subtotal += itemTotal;
        return {
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            totalPrice: itemTotal,
        };
    });
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const total = subtotal - discount + tax;
    const purchase = await Purchase_1.Purchase.create({
        shopId,
        supplierId: data.supplierId,
        invoiceNumber,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        items: processedItems,
        subtotal,
        discount,
        tax,
        total,
        paymentStatus: data.paymentStatus ?? index_2.PaymentStatus.PENDING,
        paymentMethod: data.paymentMethod,
        notes: data.notes || "",
    });
    for (const item of data.items) {
        await increaseStock(shopId, item.productId, item.quantity);
    }
    return purchase;
};
exports.createPurchase = createPurchase;
const getPurchases = async (shopId, options) => {
    const { page, limit, search, supplierId, paymentStatus, startDate, endDate } = options;
    const skip = (page - 1) * limit;
    const filter = { shopId, isDeleted: false };
    if (supplierId) {
        filter.supplierId = supplierId;
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
        filter.purchaseDate = dateFilter;
    }
    if (search) {
        filter.$or = [
            { invoiceNumber: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } },
        ];
    }
    const [purchases, total] = await Promise.all([
        Purchase_1.Purchase.find(filter)
            .populate("supplierId", "name company")
            .populate("items.productId", "name sku")
            .sort({ purchaseDate: -1 })
            .skip(skip)
            .limit(limit),
        Purchase_1.Purchase.countDocuments(filter),
    ]);
    return {
        purchases,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getPurchases = getPurchases;
const getAllPurchases = async (shopId) => {
    return Purchase_1.Purchase.find({ shopId, isDeleted: false })
        .populate("supplierId", "name company")
        .populate("items.productId", "name sku")
        .sort({ purchaseDate: -1 })
        .lean();
};
exports.getAllPurchases = getAllPurchases;
const getPurchaseById = async (shopId, purchaseId) => {
    const purchase = await Purchase_1.Purchase.findOne({
        _id: purchaseId,
        shopId,
        isDeleted: false,
    })
        .populate("supplierId", "name company phone")
        .populate("items.productId", "name sku brand");
    if (!purchase) {
        throw new AppError_1.AppError("Purchase not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return purchase;
};
exports.getPurchaseById = getPurchaseById;
const updatePurchase = async (shopId, purchaseId, data) => {
    const existing = await Purchase_1.Purchase.findOne({
        _id: purchaseId,
        shopId,
        isDeleted: false,
    });
    if (!existing) {
        throw new AppError_1.AppError("Purchase not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (data.supplierId) {
        const supplier = await Supplier_1.Supplier.findOne({
            _id: data.supplierId,
            shopId,
            isDeleted: false,
        });
        if (!supplier) {
            throw new AppError_1.AppError("Invalid Supplier ID or Supplier does not belong to this shop", index_1.HTTP_STATUS.BAD_REQUEST);
        }
    }
    if (data.items) {
        for (const item of data.items) {
            const product = await Product_1.Product.findOne({
                _id: item.productId,
                shopId,
                isDeleted: false,
            });
            if (!product) {
                throw new AppError_1.AppError(`Product with ID ${item.productId} not found or does not belong to this shop`, index_1.HTTP_STATUS.NOT_FOUND);
            }
        }
        for (const oldItem of existing.items) {
            await decreaseStock(shopId, oldItem.productId.toString(), oldItem.quantity);
        }
        for (const newItem of data.items) {
            await increaseStock(shopId, newItem.productId, newItem.quantity);
        }
    }
    const updateFields = {};
    if (data.supplierId !== undefined)
        updateFields.supplierId = data.supplierId;
    if (data.purchaseDate !== undefined)
        updateFields.purchaseDate = new Date(data.purchaseDate);
    if (data.paymentStatus !== undefined)
        updateFields.paymentStatus = data.paymentStatus;
    if (data.paymentMethod !== undefined)
        updateFields.paymentMethod = data.paymentMethod;
    if (data.notes !== undefined)
        updateFields.notes = data.notes;
    if (data.items !== undefined) {
        let subtotal = 0;
        const processedItems = data.items.map((item) => {
            const itemTotal = item.quantity * item.purchasePrice;
            subtotal += itemTotal;
            return {
                productId: item.productId,
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
    }
    else if (data.discount !== undefined || data.tax !== undefined) {
        const discount = data.discount !== undefined ? data.discount : existing.discount;
        const tax = data.tax !== undefined ? data.tax : existing.tax;
        const total = existing.subtotal - discount + tax;
        updateFields.discount = discount;
        updateFields.tax = tax;
        updateFields.total = total;
    }
    const purchase = await Purchase_1.Purchase.findOneAndUpdate({ _id: purchaseId, shopId, isDeleted: false }, { $set: updateFields }, { new: true, runValidators: true });
    if (!purchase) {
        throw new AppError_1.AppError("Purchase not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    return purchase;
};
exports.updatePurchase = updatePurchase;
const deletePurchase = async (shopId, purchaseId) => {
    const purchase = await Purchase_1.Purchase.findOne({
        _id: purchaseId,
        shopId,
        isDeleted: false,
    });
    if (!purchase) {
        throw new AppError_1.AppError("Purchase not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    for (const item of purchase.items) {
        await decreaseStock(shopId, item.productId.toString(), item.quantity);
    }
    await Purchase_1.Purchase.findOneAndUpdate({ _id: purchaseId, shopId, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });
};
exports.deletePurchase = deletePurchase;
const getPurchaseStatistics = async (shopId) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const baseFilter = { shopId, isDeleted: false };
    const [totalPurchases, todayPurchases, monthlyPurchases, amountAggregation] = await Promise.all([
        Purchase_1.Purchase.countDocuments(baseFilter),
        Purchase_1.Purchase.countDocuments({
            ...baseFilter,
            purchaseDate: { $gte: startOfDay },
        }),
        Purchase_1.Purchase.countDocuments({
            ...baseFilter,
            purchaseDate: { $gte: startOfMonth },
        }),
        Purchase_1.Purchase.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    totalPurchaseAmount: { $sum: "$total" },
                },
            },
        ]),
    ]);
    const totalPurchaseAmount = amountAggregation.length > 0
        ? Number(amountAggregation[0].totalPurchaseAmount.toFixed(2))
        : 0;
    return {
        totalPurchases,
        todayPurchases,
        monthlyPurchases,
        totalPurchaseAmount,
    };
};
exports.getPurchaseStatistics = getPurchaseStatistics;
//# sourceMappingURL=purchase.service.js.map