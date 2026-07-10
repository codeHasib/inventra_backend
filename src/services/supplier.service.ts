// src/services/supplier.service.ts
import { Supplier, ISupplier } from "../models/Supplier";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";

export const createSupplier = async (
  shopId: string,
  supplierData: Partial<ISupplier>,
): Promise<ISupplier> => {
  return await Supplier.create({ ...supplierData, shopId });
};

export const getSuppliers = async (shopId: string): Promise<ISupplier[]> => {
  return await Supplier.find({ shopId, isDeleted: false }).sort({
    createdAt: -1,
  });
};

export const getSupplierById = async (
  shopId: string,
  supplierId: string,
): Promise<ISupplier> => {
  const supplier = await Supplier.findOne({
    _id: supplierId,
    shopId,
    isDeleted: false,
  });

  if (!supplier) {
    throw new AppError("Supplier not found", HTTP_STATUS.NOT_FOUND);
  }

  return supplier;
};

export const updateSupplier = async (
  shopId: string,
  supplierId: string,
  updateData: Partial<ISupplier>,
): Promise<ISupplier> => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: supplierId, shopId, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!supplier) {
    throw new AppError("Supplier not found", HTTP_STATUS.NOT_FOUND);
  }

  return supplier;
};

export const deleteSupplier = async (
  shopId: string,
  supplierId: string,
): Promise<void> => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: supplierId, shopId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true },
  );

  if (!supplier) {
    throw new AppError("Supplier not found", HTTP_STATUS.NOT_FOUND);
  }
};
