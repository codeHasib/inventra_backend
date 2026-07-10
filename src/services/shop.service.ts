import { Shop, IShop } from "../models/Shop";
import { AppError } from "../utils/AppError";

interface PaginationResult {
  shops: IShop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const createShop = async (
  ownerId: string,
  shopData: Partial<IShop>,
): Promise<IShop> => {
  const existingSlug = await Shop.findOne({
    ownerId,
    slug: shopData.slug,
    isDeleted: false,
  });

  if (existingSlug) {
    throw new AppError("A shop with this slug already exists", 400);
  }

  return await Shop.create({ ...shopData, ownerId });
};

export const getShopsByOwner = async (
  ownerId: string,
  options: { page: number; limit: number; search?: string },
): Promise<PaginationResult> => {
  const { page, limit, search } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { ownerId, isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { businessType: { $regex: search, $options: "i" } },
    ];
  }

  const [shops, total] = await Promise.all([
    Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Shop.countDocuments(filter),
  ]);

  return {
    shops,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getShopById = async (
  ownerId: string,
  shopId: string,
): Promise<IShop> => {
  const shop = await Shop.findOne({
    _id: shopId,
    ownerId,
    isDeleted: false,
  });

  if (!shop) {
    throw new AppError("Shop not found", 404);
  }

  return shop;
};

export const updateShop = async (
  ownerId: string,
  shopId: string,
  updateData: Partial<IShop>,
): Promise<IShop> => {
  const existing = await Shop.findOne({
    _id: shopId,
    ownerId,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError("Shop not found", 404);
  }

  if (updateData.slug && updateData.slug !== existing.slug) {
    const slugTaken = await Shop.findOne({
      ownerId,
      slug: updateData.slug,
      _id: { $ne: shopId },
      isDeleted: false,
    });

    if (slugTaken) {
      throw new AppError("A shop with this slug already exists", 400);
    }
  }

  const shop = await Shop.findOneAndUpdate(
    { _id: shopId, ownerId, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!shop) {
    throw new AppError("Shop not found", 404);
  }

  return shop;
};

export const deleteShop = async (
  ownerId: string,
  shopId: string,
): Promise<void> => {
  const shop = await Shop.findOneAndUpdate(
    { _id: shopId, ownerId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true },
  );

  if (!shop) {
    throw new AppError("Shop not found", 404);
  }
};
