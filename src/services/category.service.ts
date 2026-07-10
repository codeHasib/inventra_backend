// src/services/category.service.ts
import { Category, ICategory } from "../models/Category";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

export const createCategory = async (
  shopId: string,
  categoryData: Partial<ICategory>,
): Promise<ICategory> => {
  const existingCategory = await Category.findOne({
    shopId,
    name: categoryData.name,
    isDeleted: false,
  });

  if (existingCategory) {
    throw new AppError(
      "Category with this name already exists in your shop",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return await Category.create({ ...categoryData, shopId });
};

export const getCategories = async (shopId: string): Promise<ICategory[]> => {
  return await Category.find({ shopId, isDeleted: false }).sort({
    createdAt: -1,
  });
};

export const getCategoryById = async (
  shopId: string,
  categoryId: string,
): Promise<ICategory> => {
  const category = await Category.findOne({
    _id: categoryId,
    shopId,
    isDeleted: false,
  });

  if (!category) {
    throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
  }

  return category;
};

export const updateCategory = async (
  shopId: string,
  categoryId: string,
  updateData: Partial<ICategory>,
): Promise<ICategory> => {
  if (updateData.name) {
    const existing = await Category.findOne({
      shopId,
      name: updateData.name,
      _id: { $ne: categoryId },
      isDeleted: false,
    });

    if (existing) {
      throw new AppError(
        "Another category with this name already exists",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  const category = await Category.findOneAndUpdate(
    { _id: categoryId, shopId, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
  }

  return category;
};

export const deleteCategory = async (
  shopId: string,
  categoryId: string,
): Promise<void> => {
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, shopId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true },
  );

  if (!category) {
    throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
  }
};
