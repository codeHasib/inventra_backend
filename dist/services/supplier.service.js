"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.getSupplierById = exports.getSuppliers = exports.createSupplier = void 0;
exports.getAllSuppliers = getAllSuppliers;
const Supplier_1 = require("../models/Supplier");
const AppError_1 = require("../utils/AppError");
const createSupplier = async (shopId, data) => {
    const existing = await Supplier_1.Supplier.findOne({
        shopId,
        name: data.name,
        isDeleted: false,
    });
    if (existing) {
        throw new AppError_1.AppError("A supplier with this name already exists in this shop", 400);
    }
    return await Supplier_1.Supplier.create({
        shopId,
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
        address: data.address,
        tradeLicense: data.tradeLicense,
        notes: data.notes,
    });
};
exports.createSupplier = createSupplier;
async function getAllSuppliers(shopId) {
    return Supplier_1.Supplier.find({ shopId, isDeleted: false })
        .sort({ createdAt: -1 })
        .lean();
}
const getSuppliers = async (shopId, options) => {
    const { page, limit, search, isActive } = options;
    const skip = (page - 1) * limit;
    const filter = { shopId, isDeleted: false };
    if (isActive !== undefined) {
        filter.isActive = isActive;
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { company: { $regex: search, $options: "i" } },
        ];
    }
    const [suppliers, total] = await Promise.all([
        Supplier_1.Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Supplier_1.Supplier.countDocuments(filter),
    ]);
    return {
        suppliers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getSuppliers = getSuppliers;
const getSupplierById = async (shopId, supplierId) => {
    const supplier = await Supplier_1.Supplier.findOne({
        _id: supplierId,
        shopId,
        isDeleted: false,
    });
    if (!supplier) {
        throw new AppError_1.AppError("Supplier not found", 404);
    }
    return supplier;
};
exports.getSupplierById = getSupplierById;
const updateSupplier = async (shopId, supplierId, data) => {
    const existing = await Supplier_1.Supplier.findOne({
        _id: supplierId,
        shopId,
        isDeleted: false,
    });
    if (!existing) {
        throw new AppError_1.AppError("Supplier not found", 404);
    }
    if (data.name && data.name !== existing.name) {
        const nameTaken = await Supplier_1.Supplier.findOne({
            shopId,
            name: data.name,
            _id: { $ne: supplierId },
            isDeleted: false,
        });
        if (nameTaken) {
            throw new AppError_1.AppError("A supplier with this name already exists in this shop", 400);
        }
    }
    const updateFields = {};
    if (data.name !== undefined)
        updateFields.name = data.name;
    if (data.company !== undefined)
        updateFields.company = data.company;
    if (data.phone !== undefined)
        updateFields.phone = data.phone;
    if (data.email !== undefined)
        updateFields.email = data.email;
    if (data.address !== undefined)
        updateFields.address = data.address;
    if (data.tradeLicense !== undefined)
        updateFields.tradeLicense = data.tradeLicense;
    if (data.notes !== undefined)
        updateFields.notes = data.notes;
    if (data.isActive !== undefined)
        updateFields.isActive = data.isActive;
    const supplier = await Supplier_1.Supplier.findOneAndUpdate({ _id: supplierId, shopId, isDeleted: false }, { $set: updateFields }, { new: true, runValidators: true });
    if (!supplier) {
        throw new AppError_1.AppError("Supplier not found", 404);
    }
    return supplier;
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (shopId, supplierId) => {
    const supplier = await Supplier_1.Supplier.findOneAndUpdate({ _id: supplierId, shopId, isDeleted: false }, { $set: { isDeleted: true, isActive: false } }, { new: true });
    if (!supplier) {
        throw new AppError_1.AppError("Supplier not found", 404);
    }
};
exports.deleteSupplier = deleteSupplier;
//# sourceMappingURL=supplier.service.js.map