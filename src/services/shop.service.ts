// src/services/shop.service.ts
import { Shop, IShop } from '../models/Shop';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../constants/index';

export const createShop = async (shopData: Partial<IShop>): Promise<IShop> => {
  const existingShop = await Shop.findOne({ slug: shopData.slug, isDeleted: false });
  
  if (existingShop) {
    throw new AppError('Shop with this slug already exists', HTTP_STATUS.BAD_REQUEST);
  }

  return await Shop.create(shopData);
};

export const getShopById = async (shopId: string): Promise<IShop> => {
  const shop = await Shop.findOne({ _id: shopId, isDeleted: false });
  
  if (!shop) {
    throw new AppError('Shop not found', HTTP_STATUS.NOT_FOUND);
  }
  
  return shop;
};

export const updateShop = async (shopId: string, updateData: Partial<IShop>): Promise<IShop> => {
  const shop = await Shop.findOneAndUpdate(
    { _id: shopId, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!shop) {
    throw new AppError('Shop not found', HTTP_STATUS.NOT_FOUND);
  }

  return shop;
};

export const deleteShop = async (shopId: string): Promise<void> => {
  const shop = await Shop.findOneAndUpdate(
    { _id: shopId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true }
  );

  if (!shop) {
    throw new AppError('Shop not found', HTTP_STATUS.NOT_FOUND);
  }
};