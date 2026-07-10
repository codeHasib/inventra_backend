import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../services/supplier.service";

export const createSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const { name, company, phone, email, address, tradeLicense, notes } =
      req.body;
    const supplier = await createSupplier(shopId, {
      name,
      company,
      phone,
      email,
      address,
      tradeLicense,
      notes,
    });
    sendResponse(res, 201, "Supplier created successfully", supplier);
  },
);

export const listSuppliersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const isActive =
      req.query.isActive !== undefined
        ? (req.query.isActive as string) === "true"
        : undefined;

    const result = await getSuppliers(shopId, { page, limit, search, isActive });
    sendResponse(res, 200, "Suppliers fetched successfully", result);
  },
);

export const getSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const supplierId = req.params.id as string;
    const supplier = await getSupplierById(shopId, supplierId);
    sendResponse(res, 200, "Supplier fetched successfully", supplier);
  },
);

export const updateSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const supplierId = req.params.id as string;
    const { name, company, phone, email, address, tradeLicense, notes, isActive } =
      req.body;
    const supplier = await updateSupplier(shopId, supplierId, {
      name,
      company,
      phone,
      email,
      address,
      tradeLicense,
      notes,
      isActive,
    });
    sendResponse(res, 200, "Supplier updated successfully", supplier);
  },
);

export const deleteSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shopId = req.user!.shopId!;
    const supplierId = req.params.id as string;
    await deleteSupplier(shopId, supplierId);
    sendResponse(res, 200, "Supplier deleted successfully");
  },
);
