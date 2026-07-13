"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseStatisticsHandler = exports.deletePurchaseHandler = exports.updatePurchaseHandler = exports.getPurchaseHandler = exports.getAllPurchasesHandler = exports.listPurchasesHandler = exports.createPurchaseHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const purchase_service_1 = require("../services/purchase.service");
exports.createPurchaseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const { supplierId, invoiceNumber, purchaseDate, items, discount, tax, paymentStatus, paymentMethod, notes, } = req.body;
    const purchase = await (0, purchase_service_1.createPurchase)(shopId, {
        supplierId,
        invoiceNumber,
        purchaseDate,
        items,
        discount,
        tax,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        notes,
    });
    (0, response_1.sendResponse)(res, 201, "Purchase created successfully", purchase);
});
exports.listPurchasesHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const supplierId = req.query.supplierId;
    const paymentStatus = req.query.paymentStatus;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const result = await (0, purchase_service_1.getPurchases)(shopId, {
        page,
        limit,
        search,
        supplierId,
        paymentStatus,
        startDate,
        endDate,
    });
    (0, response_1.sendResponse)(res, 200, "Purchases fetched successfully", result);
});
const getAllPurchasesHandler = async (req, res) => {
    try {
        if (!req.user?.shopId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
        }
        const purchases = await (0, purchase_service_1.getAllPurchases)(req.user.shopId);
        res.json({ success: true, message: "Purchases fetched", data: purchases });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error occurred while fetching data." });
    }
};
exports.getAllPurchasesHandler = getAllPurchasesHandler;
exports.getPurchaseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const purchaseId = req.params.id;
    const purchase = await (0, purchase_service_1.getPurchaseById)(shopId, purchaseId);
    (0, response_1.sendResponse)(res, 200, "Purchase fetched successfully", purchase);
});
exports.updatePurchaseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const purchaseId = req.params.id;
    const { supplierId, purchaseDate, items, discount, tax, paymentStatus, paymentMethod, notes, } = req.body;
    const purchase = await (0, purchase_service_1.updatePurchase)(shopId, purchaseId, {
        supplierId,
        purchaseDate,
        items,
        discount,
        tax,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        notes,
    });
    (0, response_1.sendResponse)(res, 200, "Purchase updated successfully", purchase);
});
exports.deletePurchaseHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const purchaseId = req.params.id;
    await (0, purchase_service_1.deletePurchase)(shopId, purchaseId);
    (0, response_1.sendResponse)(res, 200, "Purchase deleted successfully");
});
exports.getPurchaseStatisticsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const statistics = await (0, purchase_service_1.getPurchaseStatistics)(shopId);
    (0, response_1.sendResponse)(res, 200, "Purchase statistics fetched successfully", statistics);
});
//# sourceMappingURL=purchase.controller.js.map