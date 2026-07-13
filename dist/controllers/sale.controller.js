"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopProductsHandler = exports.getSaleStatisticsHandler = exports.refundSaleHandler = exports.deleteSaleHandler = exports.updateSaleHandler = exports.getSaleHandler = exports.getAllSalesHandler = exports.listSalesHandler = exports.createSaleHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const sale_service_1 = require("../services/sale.service");
exports.createSaleHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const { items, discount, tax, paymentMethod, paymentStatus, customerName, customerPhone, notes, } = req.body;
    const sale = await (0, sale_service_1.createSale)(shopId, {
        items,
        discount,
        tax,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        customerName,
        customerPhone,
        notes,
    });
    (0, response_1.sendResponse)(res, 201, "Sale created successfully", sale);
});
exports.listSalesHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const paymentMethod = req.query.paymentMethod;
    const paymentStatus = req.query.paymentStatus;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const result = await (0, sale_service_1.getSales)(shopId, {
        page,
        limit,
        search,
        paymentMethod,
        paymentStatus,
        startDate,
        endDate,
    });
    (0, response_1.sendResponse)(res, 200, "Sales fetched successfully", result);
});
const getAllSalesHandler = async (req, res) => {
    try {
        if (!req.user?.shopId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
        }
        const sales = await (0, sale_service_1.getAllSales)(req.user.shopId);
        res.json({ success: true, message: "Sales fetched", data: sales });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error occurred while fetching data." });
    }
};
exports.getAllSalesHandler = getAllSalesHandler;
exports.getSaleHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const saleId = req.params.id;
    const sale = await (0, sale_service_1.getSaleById)(shopId, saleId);
    (0, response_1.sendResponse)(res, 200, "Sale fetched successfully", sale);
});
exports.updateSaleHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const saleId = req.params.id;
    const { customerName, customerPhone, paymentMethod, paymentStatus, notes } = req.body;
    const sale = await (0, sale_service_1.updateSale)(shopId, saleId, {
        customerName,
        customerPhone,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        notes,
    });
    (0, response_1.sendResponse)(res, 200, "Sale updated successfully", sale);
});
exports.deleteSaleHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const saleId = req.params.id;
    await (0, sale_service_1.deleteSale)(shopId, saleId);
    (0, response_1.sendResponse)(res, 200, "Sale deleted successfully");
});
exports.refundSaleHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const saleId = req.params.id;
    const sale = await (0, sale_service_1.refundSale)(shopId, saleId);
    (0, response_1.sendResponse)(res, 200, "Sale refunded successfully", sale);
});
exports.getSaleStatisticsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const statistics = await (0, sale_service_1.getSaleStatistics)(shopId, startDate, endDate);
    (0, response_1.sendResponse)(res, 200, "Sale statistics fetched successfully", statistics);
});
exports.getTopProductsHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const limit = Number(req.query.limit) || 10;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const topProducts = await (0, sale_service_1.getTopProducts)(shopId, {
        limit,
        startDate,
        endDate,
    });
    (0, response_1.sendResponse)(res, 200, "Top products fetched successfully", topProducts);
});
//# sourceMappingURL=sale.controller.js.map