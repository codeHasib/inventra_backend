"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplierHandler = exports.updateSupplierHandler = exports.getSupplierHandler = exports.listSuppliersHandler = exports.createSupplierHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const supplier_service_1 = require("../services/supplier.service");
exports.createSupplierHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const { name, company, phone, email, address, tradeLicense, notes } = req.body;
    const supplier = await (0, supplier_service_1.createSupplier)(shopId, {
        name,
        company,
        phone,
        email,
        address,
        tradeLicense,
        notes,
    });
    (0, response_1.sendResponse)(res, 201, "Supplier created successfully", supplier);
});
exports.listSuppliersHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search;
    const isActive = req.query.isActive !== undefined
        ? req.query.isActive === "true"
        : undefined;
    const result = await (0, supplier_service_1.getSuppliers)(shopId, { page, limit, search, isActive });
    (0, response_1.sendResponse)(res, 200, "Suppliers fetched successfully", result);
});
exports.getSupplierHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const supplierId = req.params.id;
    const supplier = await (0, supplier_service_1.getSupplierById)(shopId, supplierId);
    (0, response_1.sendResponse)(res, 200, "Supplier fetched successfully", supplier);
});
exports.updateSupplierHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const supplierId = req.params.id;
    const { name, company, phone, email, address, tradeLicense, notes, isActive } = req.body;
    const supplier = await (0, supplier_service_1.updateSupplier)(shopId, supplierId, {
        name,
        company,
        phone,
        email,
        address,
        tradeLicense,
        notes,
        isActive,
    });
    (0, response_1.sendResponse)(res, 200, "Supplier updated successfully", supplier);
});
exports.deleteSupplierHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const supplierId = req.params.id;
    await (0, supplier_service_1.deleteSupplier)(shopId, supplierId);
    (0, response_1.sendResponse)(res, 200, "Supplier deleted successfully");
});
//# sourceMappingURL=supplier.controller.js.map