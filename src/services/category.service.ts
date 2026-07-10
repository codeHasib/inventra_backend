import { Category, ICategory } from "../models/Category";
import { AppError } from "../utils/AppError";

export const createCategory = async (
  shopId: string,
  data: Partial<ICategory>,
): Promise<ICategory> => {
  const existing = await Category.findOne({
    shopId,
    name: data.name,
    isDeleted: false,
  });

  if (existing) {
    throw new AppError("A category with this name already exists in this shop", 400);
  }

  return await Category.create({
    shopId,
    name: data.name,
    description: data.description,
    color: data.color,
    icon: data.icon,
  });
};

export const getCategories = async (
  shopId: string,
): Promise<ICategory[]> => {
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
    throw new AppError("Category not found", 404);
  }

  return category;
};

export const updateCategory = async (
  shopId: string,
  categoryId: string,
  data: Partial<ICategory>,
): Promise<ICategory> => {
  if (data.name) {
    const nameTaken = await Category.findOne({
      shopId,
      name: data.name,
      _id: { $ne: categoryId },
      isDeleted: false,
    });

    if (nameTaken) {
      throw new AppError("A category with this name already exists in this shop", 400);
    }
  }

  const updateFields: Partial<ICategory> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.color !== undefined) updateFields.color = data.color;
  if (data.icon !== undefined) updateFields.icon = data.icon;
  if (data.isActive !== undefined) updateFields.isActive = data.isActive;

  const category = await Category.findOneAndUpdate(
    { _id: categoryId, shopId, isDeleted: false },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw new AppError("Category not found", 404);
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
    throw new AppError("Category not found", 404);
  }
};
