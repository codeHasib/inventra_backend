import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HTTP_STATUS } from "../constants/httpStatus";
import { CATEGORY_MESSAGES } from "../constants/messages";
import { AppError } from "../utils/AppError";
import * as categoryService from "../services/category.service";

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user?.shopId;
    const userId = req.user?.id;

    if (!shopId || !userId) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access.");
    }

    const category = await categoryService.createCategory(
      shopId,
      userId,
      req.body,
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        new ApiResponse(
          HTTP_STATUS.CREATED,
          category,
          CATEGORY_MESSAGES.CREATED_SUCCESSFULLY,
        ),
      );
  },
);

export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user?.shopId;

    if (!shopId) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access.");
    }

    const categories = await categoryService.getCategories(shopId);

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          categories,
          "Categories retrieved successfully.",
        ),
      );
  },
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user?.shopId;
    const { id } = req.params;

    if (!shopId) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access.");
    }

    const category = await categoryService.getCategoryById(shopId, id);

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          category,
          "Category retrieved successfully.",
        ),
      );
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user?.shopId;
    const userId = req.user?.id;
    const { id } = req.params;

    if (!shopId || !userId) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access.");
    }

    const category = await categoryService.updateCategory(
      shopId,
      id,
      userId,
      req.body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          category,
          CATEGORY_MESSAGES.UPDATED_SUCCESSFULLY,
        ),
      );
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user?.shopId;
    const userId = req.user?.id;
    const { id } = req.params;

    if (!shopId || !userId) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access.");
    }

    await categoryService.deleteCategory(shopId, id, userId);

    res
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse(
          HTTP_STATUS.OK,
          null,
          CATEGORY_MESSAGES.DELETED_SUCCESSFULLY,
        ),
      );
  },
);
