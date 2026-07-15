"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutOfStockProductsHandler = exports.getAllProductsHandler = exports.getLowStockProductsHandler = exports.getProductStatisticsHandler = exports.updateStockHandler = exports.deleteProductHandler = exports.updateProductHandler = exports.getProductHandler = exports.listProductsHandler = exports.createProductHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const product_service_1 = require("../services/product.service");
exports.createProductHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const { categoryId, supplierId, name, description, sku, barcode, brand, purchasePrice, sellingPrice, currentStock, minimumStock, maximumStock, reorderLevel, unit, images, expiryDate, manufactureDate, } = req.body;
        const product = await (0, product_service_1.createProduct)(shopId, {
            categoryId,
            supplierId,
            name,
            description,
            sku,
            barcode,
            brand,
            purchasePrice,
            sellingPrice,
            currentStock,
            minimumStock,
            maximumStock,
            reorderLevel,
            unit,
            images,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            manufactureDate: manufactureDate ? new Date(manufactureDate) : undefined,
        });
        (0, response_1.sendResponse)(res, 201, "Product created successfully", product);
    }
    catch (error) {
        if (error?.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {}).join(", ");
            return res.status(400).json({
                success: false,
                message: duplicateField
                    ? `A product with this ${duplicateField} already exists.`
                    : "A product with this SKU, Slug, or Barcode already exists.",
            });
        }
        throw error;
    }
});
exports.listProductsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const categoryId = req.query.categoryId;
    const supplierId = req.query.supplierId;
    const status = req.query.status;
    const brand = req.query.brand;
    const lowStock = req.query.lowStock !== undefined
        ? req.query.lowStock === "true"
        : undefined;
    const outOfStock = req.query.outOfStock !== undefined
        ? req.query.outOfStock === "true"
        : undefined;
    const isActive = req.query.isActive !== undefined
        ? req.query.isActive === "true"
        : undefined;
    const sort = req.query.sort;
    const result = await (0, product_service_1.getProducts)(shopId, {
        page,
        limit,
        search,
        categoryId,
        supplierId,
        status,
        brand,
        lowStock,
        outOfStock,
        isActive,
        sort,
    });
    (0, response_1.sendResponse)(res, 200, "Products fetched successfully", result);
});
exports.getProductHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const productId = req.params.id;
    const product = await (0, product_service_1.getProductById)(shopId, productId);
    (0, response_1.sendResponse)(res, 200, "Product fetched successfully", product);
});
exports.updateProductHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const productId = req.params.id;
    const { categoryId, supplierId, name, description, sku, barcode, brand, purchasePrice, sellingPrice, currentStock, minimumStock, maximumStock, reorderLevel, unit, images, expiryDate, manufactureDate, status, isActive, } = req.body;
    const product = await (0, product_service_1.updateProduct)(shopId, productId, {
        categoryId,
        supplierId,
        name,
        description,
        sku,
        barcode,
        brand,
        purchasePrice,
        sellingPrice,
        currentStock,
        minimumStock,
        maximumStock,
        reorderLevel,
        unit,
        images,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
        manufactureDate: manufactureDate !== undefined
            ? manufactureDate
                ? new Date(manufactureDate)
                : null
            : undefined,
        status,
        isActive,
    });
    (0, response_1.sendResponse)(res, 200, "Product updated successfully", product);
});
exports.deleteProductHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const productId = req.params.id;
    await (0, product_service_1.deleteProduct)(shopId, productId);
    (0, response_1.sendResponse)(res, 200, "Product deleted successfully");
});
exports.updateStockHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const productId = req.params.id;
    const { currentStock } = req.body;
    const product = await (0, product_service_1.updateStock)(shopId, productId, currentStock);
    (0, response_1.sendResponse)(res, 200, "Stock updated successfully", product);
});
exports.getProductStatisticsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const statistics = await (0, product_service_1.getProductStatistics)(shopId);
    (0, response_1.sendResponse)(res, 200, "Statistics fetched successfully", statistics);
});
exports.getLowStockProductsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const products = await (0, product_service_1.getLowStockProducts)(shopId);
    (0, response_1.sendResponse)(res, 200, "Low stock products fetched successfully", products);
});
const getAllProductsHandler = async (req, res) => {
    try {
        if (!req.user?.shopId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
        }
        const products = await (0, product_service_1.getAllProducts)(req.user.shopId);
        res.json({ success: true, message: "Products fetched", data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error occurred while fetching data." });
    }
};
exports.getAllProductsHandler = getAllProductsHandler;
exports.getOutOfStockProductsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const products = await (0, product_service_1.getOutOfStockProducts)(shopId);
    (0, response_1.sendResponse)(res, 200, "Out of stock products fetched successfully", products);
});
//# sourceMappingURL=product.controller.js.map