"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutOfStockProducts = exports.getLowStockProducts = exports.getProductStatistics = exports.updateStock = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const Supplier_1 = require("../models/Supplier");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../enums/index");
const determineStatus = (currentStock, reorderLevel) => {
    if (currentStock <= 0)
        return index_1.ProductStatus.OUT_OF_STOCK;
    if (currentStock <= reorderLevel)
        return index_1.ProductStatus.LOW_STOCK;
    return index_1.ProductStatus.ACTIVE;
};
const calculateProfitMargin = (purchasePrice, sellingPrice) => {
    if (purchasePrice === 0)
        return 0;
    return Number((((sellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(2));
};
const generateSku = (name, shopId) => {
    const prefix = name
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 3)
        .toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};
const createProduct = async (shopId, data) => {
    const category = await Category_1.Category.findOne({
        _id: data.categoryId,
        shopId,
        isDeleted: false,
    });
    if (!category) {
        throw new AppError_1.AppError("Invalid Category ID or Category does not belong to this shop", 400);
    }
    const supplier = await Supplier_1.Supplier.findOne({
        _id: data.supplierId,
        shopId,
        isDeleted: false,
    });
    if (!supplier) {
        throw new AppError_1.AppError("Invalid Supplier ID or Supplier does not belong to this shop", 400);
    }
    const sku = data.sku || generateSku(data.name || "PRD", shopId);
    const existingSku = await Product_1.Product.findOne({
        shopId,
        sku,
        isDeleted: false,
    });
    if (existingSku) {
        throw new AppError_1.AppError("Product with this SKU already exists in this shop", 400);
    }
    if (data.barcode) {
        const existingBarcode = await Product_1.Product.findOne({
            shopId,
            barcode: data.barcode,
            isDeleted: false,
        });
        if (existingBarcode) {
            throw new AppError_1.AppError("Product with this barcode already exists in this shop", 400);
        }
    }
    const existingName = await Product_1.Product.findOne({
        shopId,
        name: data.name,
        isDeleted: false,
    });
    if (existingName) {
        throw new AppError_1.AppError("Product with this name already exists in this shop", 400);
    }
    const purchasePrice = data.purchasePrice || 0;
    const sellingPrice = data.sellingPrice || 0;
    const profitMargin = calculateProfitMargin(purchasePrice, sellingPrice);
    const currentStock = data.currentStock || 0;
    const reorderLevel = data.reorderLevel || 10;
    const status = determineStatus(currentStock, reorderLevel);
    return await Product_1.Product.create({
        shopId,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        name: data.name,
        description: data.description,
        sku,
        barcode: data.barcode,
        brand: data.brand,
        purchasePrice,
        sellingPrice,
        profitMargin,
        currentStock,
        minimumStock: data.minimumStock,
        maximumStock: data.maximumStock,
        reorderLevel,
        unit: data.unit,
        images: data.images,
        expiryDate: data.expiryDate || null,
        manufactureDate: data.manufactureDate || null,
        status,
    });
};
exports.createProduct = createProduct;
const getProducts = async (shopId, options) => {
    const { page, limit, search, categoryId, supplierId, status, brand, lowStock, outOfStock, isActive, sort, } = options;
    const skip = (page - 1) * limit;
    const filter = { shopId, isDeleted: false };
    if (isActive !== undefined) {
        filter.isActive = isActive;
    }
    if (categoryId) {
        filter.categoryId = categoryId;
    }
    if (supplierId) {
        filter.supplierId = supplierId;
    }
    if (status) {
        filter.status = status;
    }
    if (brand) {
        filter.brand = { $regex: brand, $options: "i" };
    }
    if (lowStock) {
        filter.$expr = { $lte: ["$currentStock", "$reorderLevel"] };
        filter.currentStock = { $gt: 0 };
    }
    if (outOfStock) {
        filter.currentStock = { $lte: 0 };
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
            { barcode: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
        ];
    }
    let sortOption = { createdAt: -1 };
    if (sort) {
        switch (sort) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "name-asc":
                sortOption = { name: 1 };
                break;
            case "price-asc":
                sortOption = { sellingPrice: 1 };
                break;
            case "price-desc":
                sortOption = { sellingPrice: -1 };
                break;
            case "stock-asc":
                sortOption = { currentStock: 1 };
                break;
            case "stock-desc":
                sortOption = { currentStock: -1 };
                break;
        }
    }
    const [products, total] = await Promise.all([
        Product_1.Product.find(filter)
            .populate("categoryId", "name color icon")
            .populate("supplierId", "name company")
            .sort(sortOption)
            .skip(skip)
            .limit(limit),
        Product_1.Product.countDocuments(filter),
    ]);
    return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getProducts = getProducts;
const getProductById = async (shopId, productId) => {
    const product = await Product_1.Product.findOne({
        _id: productId,
        shopId,
        isDeleted: false,
    })
        .populate("categoryId", "name color icon")
        .populate("supplierId", "name company");
    if (!product) {
        throw new AppError_1.AppError("Product not found", 404);
    }
    return product;
};
exports.getProductById = getProductById;
const updateProduct = async (shopId, productId, data) => {
    const existing = await Product_1.Product.findOne({
        _id: productId,
        shopId,
        isDeleted: false,
    });
    if (!existing) {
        throw new AppError_1.AppError("Product not found", 404);
    }
    if (data.name && data.name !== existing.name) {
        const nameTaken = await Product_1.Product.findOne({
            shopId,
            name: data.name,
            _id: { $ne: productId },
            isDeleted: false,
        });
        if (nameTaken) {
            throw new AppError_1.AppError("Product with this name already exists in this shop", 400);
        }
    }
    if (data.sku && data.sku !== existing.sku) {
        const skuTaken = await Product_1.Product.findOne({
            shopId,
            sku: data.sku,
            _id: { $ne: productId },
            isDeleted: false,
        });
        if (skuTaken) {
            throw new AppError_1.AppError("Product with this SKU already exists in this shop", 400);
        }
    }
    if (data.barcode && data.barcode !== existing.barcode) {
        const barcodeTaken = await Product_1.Product.findOne({
            shopId,
            barcode: data.barcode,
            _id: { $ne: productId },
            isDeleted: false,
        });
        if (barcodeTaken) {
            throw new AppError_1.AppError("Product with this barcode already exists in this shop", 400);
        }
    }
    if (data.categoryId) {
        const category = await Category_1.Category.findOne({
            _id: data.categoryId,
            shopId,
            isDeleted: false,
        });
        if (!category) {
            throw new AppError_1.AppError("Invalid Category ID or Category does not belong to this shop", 400);
        }
    }
    if (data.supplierId) {
        const supplier = await Supplier_1.Supplier.findOne({
            _id: data.supplierId,
            shopId,
            isDeleted: false,
        });
        if (!supplier) {
            throw new AppError_1.AppError("Invalid Supplier ID or Supplier does not belong to this shop", 400);
        }
    }
    const updateFields = {};
    if (data.categoryId !== undefined)
        updateFields.categoryId = data.categoryId;
    if (data.supplierId !== undefined)
        updateFields.supplierId = data.supplierId;
    if (data.name !== undefined)
        updateFields.name = data.name;
    if (data.description !== undefined)
        updateFields.description = data.description;
    if (data.sku !== undefined)
        updateFields.sku = data.sku;
    if (data.barcode !== undefined)
        updateFields.barcode = data.barcode;
    if (data.brand !== undefined)
        updateFields.brand = data.brand;
    if (data.unit !== undefined)
        updateFields.unit = data.unit;
    if (data.images !== undefined)
        updateFields.images = data.images;
    if (data.expiryDate !== undefined)
        updateFields.expiryDate = data.expiryDate;
    if (data.manufactureDate !== undefined)
        updateFields.manufactureDate = data.manufactureDate;
    if (data.isActive !== undefined)
        updateFields.isActive = data.isActive;
    const purchasePrice = data.purchasePrice !== undefined ? data.purchasePrice : existing.purchasePrice;
    const sellingPrice = data.sellingPrice !== undefined ? data.sellingPrice : existing.sellingPrice;
    if (data.purchasePrice !== undefined || data.sellingPrice !== undefined) {
        updateFields.purchasePrice = purchasePrice;
        updateFields.sellingPrice = sellingPrice;
        updateFields.profitMargin = calculateProfitMargin(purchasePrice, sellingPrice);
    }
    if (data.currentStock !== undefined ||
        data.reorderLevel !== undefined) {
        const currentStock = data.currentStock !== undefined ? data.currentStock : existing.currentStock;
        const reorderLevel = data.reorderLevel !== undefined ? data.reorderLevel : existing.reorderLevel;
        updateFields.currentStock = currentStock;
        updateFields.reorderLevel = reorderLevel;
        if (data.status === undefined) {
            updateFields.status = determineStatus(currentStock, reorderLevel);
        }
    }
    if (data.status !== undefined) {
        updateFields.status = data.status;
    }
    if (data.minimumStock !== undefined)
        updateFields.minimumStock = data.minimumStock;
    if (data.maximumStock !== undefined)
        updateFields.maximumStock = data.maximumStock;
    const product = await Product_1.Product.findOneAndUpdate({ _id: productId, shopId, isDeleted: false }, { $set: updateFields }, { new: true, runValidators: true });
    if (!product) {
        throw new AppError_1.AppError("Product not found", 404);
    }
    return product;
};
exports.updateProduct = updateProduct;
const deleteProduct = async (shopId, productId) => {
    const product = await Product_1.Product.findOneAndUpdate({ _id: productId, shopId, isDeleted: false }, { $set: { isDeleted: true, isActive: false, status: index_1.ProductStatus.DISCONTINUED } }, { new: true });
    if (!product) {
        throw new AppError_1.AppError("Product not found", 404);
    }
};
exports.deleteProduct = deleteProduct;
const updateStock = async (shopId, productId, newStock) => {
    const product = await Product_1.Product.findOne({
        _id: productId,
        shopId,
        isDeleted: false,
    });
    if (!product) {
        throw new AppError_1.AppError("Product not found", 404);
    }
    const status = determineStatus(newStock, product.reorderLevel);
    const updated = await Product_1.Product.findOneAndUpdate({ _id: productId, shopId, isDeleted: false }, { $set: { currentStock: newStock, status } }, { new: true, runValidators: true });
    if (!updated) {
        throw new AppError_1.AppError("Product not found", 404);
    }
    return updated;
};
exports.updateStock = updateStock;
const getProductStatistics = async (shopId) => {
    const baseFilter = { shopId, isDeleted: false };
    const [totalProducts, activeProducts, outOfStock, lowStockProducts, inventoryAggregation,] = await Promise.all([
        Product_1.Product.countDocuments(baseFilter),
        Product_1.Product.countDocuments({ ...baseFilter, status: index_1.ProductStatus.ACTIVE }),
        Product_1.Product.countDocuments({ ...baseFilter, currentStock: { $lte: 0 } }),
        Product_1.Product.countDocuments({
            ...baseFilter,
            currentStock: { $gt: 0 },
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
        }),
        Product_1.Product.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: null,
                    totalInventoryValue: {
                        $sum: { $multiply: ["$currentStock", "$purchasePrice"] },
                    },
                    averageProfitMargin: { $avg: "$profitMargin" },
                },
            },
        ]),
    ]);
    const totalInventoryValue = inventoryAggregation.length > 0
        ? Number(inventoryAggregation[0].totalInventoryValue.toFixed(2))
        : 0;
    const averageProfitMargin = inventoryAggregation.length > 0
        ? Number(inventoryAggregation[0].averageProfitMargin.toFixed(2))
        : 0;
    return {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock: lowStockProducts,
        totalInventoryValue,
        averageProfitMargin,
    };
};
exports.getProductStatistics = getProductStatistics;
const getLowStockProducts = async (shopId) => {
    return await Product_1.Product.find({
        shopId,
        isDeleted: false,
        currentStock: { $gt: 0 },
        $expr: { $lte: ["$currentStock", "$reorderLevel"] },
    })
        .populate("categoryId", "name color icon")
        .populate("supplierId", "name company")
        .sort({ currentStock: 1 });
};
exports.getLowStockProducts = getLowStockProducts;
const getOutOfStockProducts = async (shopId) => {
    return await Product_1.Product.find({
        shopId,
        isDeleted: false,
        currentStock: { $lte: 0 },
    })
        .populate("categoryId", "name color icon")
        .populate("supplierId", "name company")
        .sort({ createdAt: -1 });
};
exports.getOutOfStockProducts = getOutOfStockProducts;
//# sourceMappingURL=product.service.js.map