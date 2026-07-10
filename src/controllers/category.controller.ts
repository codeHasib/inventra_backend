import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

export const createCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const { name, description, color, icon } = req.body;
    const category = await createCategory(shopId, {
      name,
      description,
      color,
      icon,
    });
    sendResponse(res, 201, "Category created successfully", category);
  },
);

export const listCategoriesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const categories = await getCategories(shopId);
    sendResponse(res, 200, "Categories fetched successfully", categories);
  },
);

export const getCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const categoryId = req.params.id as string;
    const category = await getCategoryById(shopId, categoryId);
    sendResponse(res, 200, "Category fetched successfully", category);
  },
);

export const updateCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const categoryId = req.params.id as string;
    const { name, description, color, icon, isActive } = req.body;
    const category = await updateCategory(shopId, categoryId, {
      name,
      description,
      color,
      icon,
      isActive,
    });
    sendResponse(res, 200, "Category updated successfully", category);
  },
);

export const deleteCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const categoryId = req.params.id as string;
    await deleteCategory(shopId, categoryId);
    sendResponse(res, 200, "Category deleted successfully");
  },
);
