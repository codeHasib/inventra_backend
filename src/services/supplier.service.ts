import { Supplier, ISupplier } from "../models/Supplier";
import { AppError } from "../utils/AppError";

interface PaginationResult {
  suppliers: ISupplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const createSupplier = async (
  shopId: string,
  data: Partial<ISupplier>,
): Promise<ISupplier> => {
  const existing = await Supplier.findOne({
    shopId,
    name: data.name,
    isDeleted: false,
  });

  if (existing) {
    throw new AppError(
      "A supplier with this name already exists in this shop",
      400,
    );
  }

  return await Supplier.create({
    shopId,
    name: data.name,
    company: data.company,
    phone: data.phone,
    email: data.email,
    address: data.address,
    tradeLicense: data.tradeLicense,
    notes: data.notes,
  });
};

export const getSuppliers = async (
  shopId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  },
): Promise<PaginationResult> => {
  const { page, limit, search, isActive } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { shopId, isDeleted: false };

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Supplier.countDocuments(filter),
  ]);

  return {
    suppliers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
    throw new AppError("Supplier not found", 404);
  }

  return supplier;
};

export const updateSupplier = async (
  shopId: string,
  supplierId: string,
  data: Partial<ISupplier>,
): Promise<ISupplier> => {
  const existing = await Supplier.findOne({
    _id: supplierId,
    shopId,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError("Supplier not found", 404);
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await Supplier.findOne({
      shopId,
      name: data.name,
      _id: { $ne: supplierId },
      isDeleted: false,
    });

    if (nameTaken) {
      throw new AppError(
        "A supplier with this name already exists in this shop",
        400,
      );
    }
  }

  const updateFields: Partial<ISupplier> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.company !== undefined) updateFields.company = data.company;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.tradeLicense !== undefined)
    updateFields.tradeLicense = data.tradeLicense;
  if (data.notes !== undefined) updateFields.notes = data.notes;
  if (data.isActive !== undefined) updateFields.isActive = data.isActive;

  const supplier = await Supplier.findOneAndUpdate(
    { _id: supplierId, shopId, isDeleted: false },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
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
    throw new AppError("Supplier not found", 404);
  }
};
