import { Category, ICategory } from "../models/category.model";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";
import { CATEGORY_MESSAGES } from "../constants/messages";

export const createCategory = async (
  shopId: string,
  userId: string,
  categoryData: Partial<ICategory>,
): Promise<ICategory> => {
  const existingCategory = await Category.findOne({
    shopId,
    name: categoryData.name,
    isDeleted: false,
  });

  if (existingCategory) {
    throw new AppError(
      HTTP_STATUS.CONFLICT,
      "Category name already exists in this shop.",
    );
  }

  const category = await Category.create({
    ...categoryData,
    shopId,
    createdBy: userId,
    updatedBy: userId,
  });

  return category;
};

export const getCategories = async (shopId: string): Promise<ICategory[]> => {
  return Category.find({ shopId, isDeleted: false });
};

export const getCategoryById = async (
  shopId: string,
  id: string,
): Promise<ICategory> => {
  const category = await Category.findOne({
    _id: id,
    shopId,
    isDeleted: false,
  });

  if (!category) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, CATEGORY_MESSAGES.NOT_FOUND);
  }

  return category;
};

export const updateCategory = async (
  shopId: string,
  id: string,
  userId: string,
  updateData: Partial<ICategory>,
): Promise<ICategory> => {
  if (updateData.name) {
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      shopId,
      name: updateData.name,
      isDeleted: false,
    });

    if (existingCategory) {
      throw new AppError(
        HTTP_STATUS.CONFLICT,
        "Category name already exists in this shop.",
      );
    }
  }

  const category = await Category.findOneAndUpdate(
    { _id: id, shopId, isDeleted: false },
    { ...updateData, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, CATEGORY_MESSAGES.NOT_FOUND);
  }

  return category;
};

export const deleteCategory = async (
  shopId: string,
  id: string,
  userId: string,
): Promise<ICategory> => {
  const category = await Category.findOneAndUpdate(
    { _id: id, shopId, isDeleted: false },
    { isDeleted: true, updatedBy: userId },
    { new: true },
  );

  if (!category) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, CATEGORY_MESSAGES.NOT_FOUND);
  }

  return category;
};
