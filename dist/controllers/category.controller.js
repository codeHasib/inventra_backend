"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryHandler = exports.updateCategoryHandler = exports.getCategoryHandler = exports.listCategoriesHandler = exports.createCategoryHandler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const category_service_1 = require("../services/category.service");
exports.createCategoryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const { name, description, color, icon } = req.body;
    const category = await (0, category_service_1.createCategory)(shopId, {
        name,
        description,
        color,
        icon,
    });
    (0, response_1.sendResponse)(res, 201, "Category created successfully", category);
});
exports.listCategoriesHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const categories = await (0, category_service_1.getCategories)(shopId);
    (0, response_1.sendResponse)(res, 200, "Categories fetched successfully", categories);
});
exports.getCategoryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const categoryId = req.params.id;
    const category = await (0, category_service_1.getCategoryById)(shopId, categoryId);
    (0, response_1.sendResponse)(res, 200, "Category fetched successfully", category);
});
exports.updateCategoryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const categoryId = req.params.id;
    const { name, description, color, icon, isActive } = req.body;
    const category = await (0, category_service_1.updateCategory)(shopId, categoryId, {
        name,
        description,
        color,
        icon,
        isActive,
    });
    (0, response_1.sendResponse)(res, 200, "Category updated successfully", category);
});
exports.deleteCategoryHandler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shopId = req.user.shopId;
    const categoryId = req.params.id;
    await (0, category_service_1.deleteCategory)(shopId, categoryId);
    (0, response_1.sendResponse)(res, 200, "Category deleted successfully");
});
//# sourceMappingURL=category.controller.js.map