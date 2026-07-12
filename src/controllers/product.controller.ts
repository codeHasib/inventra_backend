import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import {
  createProduct,
  getProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductStatistics,
  getLowStockProducts,
  getOutOfStockProducts,
} from "../services/product.service";
import { ProductStatus } from "../enums/index";

export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const {
      categoryId,
      supplierId,
      name,
      description,
      sku,
      barcode,
      brand,
      purchasePrice,
      sellingPrice,
      currentStock,
      minimumStock,
      maximumStock,
      reorderLevel,
      unit,
      images,
      expiryDate,
      manufactureDate,
    } = req.body;
    const product = await createProduct(shopId, {
      categoryId,
      supplierId,
      name,
      description,
      sku,
      barcode,
      brand,
      purchasePrice,
      sellingPrice,
      currentStock,
      minimumStock,
      maximumStock,
      reorderLevel,
      unit,
      images,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      manufactureDate: manufactureDate ? new Date(manufactureDate) : undefined,
    } as Partial<import("../models/Product").IProduct>);
    sendResponse(res, 201, "Product created successfully", product);
  },
);

export const listProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const supplierId = req.query.supplierId as string | undefined;
    const status = req.query.status as ProductStatus | undefined;
    const brand = req.query.brand as string | undefined;
    const lowStock =
      req.query.lowStock !== undefined
        ? (req.query.lowStock as string) === "true"
        : undefined;
    const outOfStock =
      req.query.outOfStock !== undefined
        ? (req.query.outOfStock as string) === "true"
        : undefined;
    const isActive =
      req.query.isActive !== undefined
        ? (req.query.isActive as string) === "true"
        : undefined;
    const sort = req.query.sort as string | undefined;

    const result = await getProducts(shopId, {
      page,
      limit,
      search,
      categoryId,
      supplierId,
      status,
      brand,
      lowStock,
      outOfStock,
      isActive,
      sort,
    });
    sendResponse(res, 200, "Products fetched successfully", result);
  },
);

export const getProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.id as string;
    const product = await getProductById(shopId, productId);
    sendResponse(res, 200, "Product fetched successfully", product);
  },
);

export const updateProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.id as string;
    const {
      categoryId,
      supplierId,
      name,
      description,
      sku,
      barcode,
      brand,
      purchasePrice,
      sellingPrice,
      currentStock,
      minimumStock,
      maximumStock,
      reorderLevel,
      unit,
      images,
      expiryDate,
      manufactureDate,
      status,
      isActive,
    } = req.body;
    const product = await updateProduct(shopId, productId, {
      categoryId,
      supplierId,
      name,
      description,
      sku,
      barcode,
      brand,
      purchasePrice,
      sellingPrice,
      currentStock,
      minimumStock,
      maximumStock,
      reorderLevel,
      unit,
      images,
      expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
      manufactureDate:
        manufactureDate !== undefined
          ? manufactureDate
            ? new Date(manufactureDate)
            : null
          : undefined,
      status,
      isActive,
    } as Partial<import("../models/Product").IProduct>);
    sendResponse(res, 200, "Product updated successfully", product);
  },
);

export const deleteProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.id as string;
    await deleteProduct(shopId, productId);
    sendResponse(res, 200, "Product deleted successfully");
  },
);

export const updateStockHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const productId = req.params.id as string;
    const { currentStock } = req.body;
    const product = await updateStock(shopId, productId, currentStock);
    sendResponse(res, 200, "Stock updated successfully", product);
  },
);

export const getProductStatisticsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const statistics = await getProductStatistics(shopId);
    sendResponse(res, 200, "Statistics fetched successfully", statistics);
  },
);

export const getLowStockProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const products = await getLowStockProducts(shopId);
    sendResponse(res, 200, "Low stock products fetched successfully", products);
  },
);

export const getAllProductsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Shop context missing." });
    }

    const products = await getAllProducts(req.user.shopId);

    res.json({ success: true, message: "Products fetched", data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error occurred while fetching data." });
  }
};

export const getOutOfStockProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const products = await getOutOfStockProducts(shopId);
    sendResponse(
      res,
      200,
      "Out of stock products fetched successfully",
      products,
    );
  },
);
