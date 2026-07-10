"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const Category_1 = require("../models/Category");
const AppError_1 = require("../utils/AppError");
const createCategory = async (shopId, data) => {
    const existing = await Category_1.Category.findOne({
        shopId,
        name: data.name,
        isDeleted: false,
    });
    if (existing) {
        throw new AppError_1.AppError("A category with this name already exists in this shop", 400);
    }
    return await Category_1.Category.create({
        shopId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
    });
};
exports.createCategory = createCategory;
const getCategories = async (shopId) => {
    return await Category_1.Category.find({ shopId, isDeleted: false }).sort({
        createdAt: -1,
    });
};
exports.getCategories = getCategories;
const getCategoryById = async (shopId, categoryId) => {
    const category = await Category_1.Category.findOne({
        _id: categoryId,
        shopId,
        isDeleted: false,
    });
    if (!category) {
        throw new AppError_1.AppError("Category not found", 404);
    }
    return category;
};
exports.getCategoryById = getCategoryById;
const updateCategory = async (shopId, categoryId, data) => {
    if (data.name) {
        const nameTaken = await Category_1.Category.findOne({
            shopId,
            name: data.name,
            _id: { $ne: categoryId },
            isDeleted: false,
        });
        if (nameTaken) {
            throw new AppError_1.AppError("A category with this name already exists in this shop", 400);
        }
    }
    const updateFields = {};
    if (data.name !== undefined)
        updateFields.name = data.name;
    if (data.description !== undefined)
        updateFields.description = data.description;
    if (data.color !== undefined)
        updateFields.color = data.color;
    if (data.icon !== undefined)
        updateFields.icon = data.icon;
    if (data.isActive !== undefined)
        updateFields.isActive = data.isActive;
    const category = await Category_1.Category.findOneAndUpdate({ _id: categoryId, shopId, isDeleted: false }, { $set: updateFields }, { new: true, runValidators: true });
    if (!category) {
        throw new AppError_1.AppError("Category not found", 404);
    }
    return category;
};
exports.updateCategory = updateCategory;
const deleteCategory = async (shopId, categoryId) => {
    const category = await Category_1.Category.findOneAndUpdate({ _id: categoryId, shopId, isDeleted: false }, { $set: { isDeleted: true, isActive: false } }, { new: true });
    if (!category) {
        throw new AppError_1.AppError("Category not found", 404);
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.service.js.map