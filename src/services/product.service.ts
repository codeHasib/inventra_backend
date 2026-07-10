import { Product, IProduct } from "../models/Product";
import { Category } from "../models/Category";
import { Supplier } from "../models/Supplier";
import { AppError } from "../utils/AppError";
import { ProductStatus } from "../enums/index";

interface PaginationResult {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  totalInventoryValue: number;
  averageProfitMargin: number;
}

const determineStatus = (
  currentStock: number,
  reorderLevel: number,
): ProductStatus => {
  if (currentStock <= 0) return ProductStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return ProductStatus.LOW_STOCK;
  return ProductStatus.ACTIVE;
};

const calculateProfitMargin = (
  purchasePrice: number,
  sellingPrice: number,
): number => {
  if (purchasePrice === 0) return 0;
  return Number((((sellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(2));
};

const generateSku = (name: string, shopId: string): string => {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const createProduct = async (
  shopId: string,
  data: Partial<IProduct>,
): Promise<IProduct> => {
  const category = await Category.findOne({
    _id: data.categoryId,
    shopId,
    isDeleted: false,
  });
  if (!category) {
    throw new AppError(
      "Invalid Category ID or Category does not belong to this shop",
      400,
    );
  }

  const supplier = await Supplier.findOne({
    _id: data.supplierId,
    shopId,
    isDeleted: false,
  });
  if (!supplier) {
    throw new AppError(
      "Invalid Supplier ID or Supplier does not belong to this shop",
      400,
    );
  }

  const sku = data.sku || generateSku(data.name || "PRD", shopId);

  const existingSku = await Product.findOne({
    shopId,
    sku,
    isDeleted: false,
  });
  if (existingSku) {
    throw new AppError("Product with this SKU already exists in this shop", 400);
  }

  if (data.barcode) {
    const existingBarcode = await Product.findOne({
      shopId,
      barcode: data.barcode,
      isDeleted: false,
    });
    if (existingBarcode) {
      throw new AppError("Product with this barcode already exists in this shop", 400);
    }
  }

  const existingName = await Product.findOne({
    shopId,
    name: data.name,
    isDeleted: false,
  });
  if (existingName) {
    throw new AppError("Product with this name already exists in this shop", 400);
  }

  const purchasePrice = data.purchasePrice || 0;
  const sellingPrice = data.sellingPrice || 0;
  const profitMargin = calculateProfitMargin(purchasePrice, sellingPrice);

  const currentStock = data.currentStock || 0;
  const reorderLevel = data.reorderLevel || 10;
  const status = determineStatus(currentStock, reorderLevel);

  return await Product.create({
    shopId,
    categoryId: data.categoryId,
    supplierId: data.supplierId,
    name: data.name,
    description: data.description,
    sku,
    barcode: data.barcode,
    brand: data.brand,
    purchasePrice,
    sellingPrice,
    profitMargin,
    currentStock,
    minimumStock: data.minimumStock,
    maximumStock: data.maximumStock,
    reorderLevel,
    unit: data.unit,
    images: data.images,
    expiryDate: data.expiryDate || null,
    manufactureDate: data.manufactureDate || null,
    status,
  });
};

export const getProducts = async (
  shopId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    supplierId?: string;
    status?: ProductStatus;
    brand?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    isActive?: boolean;
    sort?: string;
  },
): Promise<PaginationResult> => {
  const {
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
  } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { shopId, isDeleted: false };

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (supplierId) {
    filter.supplierId = supplierId;
  }

  if (status) {
    filter.status = status;
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: "i" };
  }

  if (lowStock) {
    filter.$expr = { $lte: ["$currentStock", "$reorderLevel"] };
    filter.currentStock = { $gt: 0 };
  }

  if (outOfStock) {
    filter.currentStock = { $lte: 0 };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort) {
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "name-asc":
        sortOption = { name: 1 };
        break;
      case "price-asc":
        sortOption = { sellingPrice: 1 };
        break;
      case "price-desc":
        sortOption = { sellingPrice: -1 };
        break;
      case "stock-asc":
        sortOption = { currentStock: 1 };
        break;
      case "stock-desc":
        sortOption = { currentStock: -1 };
        break;
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name color icon")
      .populate("supplierId", "name company")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getProductById = async (
  shopId: string,
  productId: string,
): Promise<IProduct> => {
  const product = await Product.findOne({
    _id: productId,
    shopId,
    isDeleted: false,
  })
    .populate("categoryId", "name color icon")
    .populate("supplierId", "name company");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const updateProduct = async (
  shopId: string,
  productId: string,
  data: Partial<IProduct>,
): Promise<IProduct> => {
  const existing = await Product.findOne({
    _id: productId,
    shopId,
    isDeleted: false,
  });

  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await Product.findOne({
      shopId,
      name: data.name,
      _id: { $ne: productId },
      isDeleted: false,
    });
    if (nameTaken) {
      throw new AppError("Product with this name already exists in this shop", 400);
    }
  }

  if (data.sku && data.sku !== existing.sku) {
    const skuTaken = await Product.findOne({
      shopId,
      sku: data.sku,
      _id: { $ne: productId },
      isDeleted: false,
    });
    if (skuTaken) {
      throw new AppError("Product with this SKU already exists in this shop", 400);
    }
  }

  if (data.barcode && data.barcode !== existing.barcode) {
    const barcodeTaken = await Product.findOne({
      shopId,
      barcode: data.barcode,
      _id: { $ne: productId },
      isDeleted: false,
    });
    if (barcodeTaken) {
      throw new AppError("Product with this barcode already exists in this shop", 400);
    }
  }

  if (data.categoryId) {
    const category = await Category.findOne({
      _id: data.categoryId,
      shopId,
      isDeleted: false,
    });
    if (!category) {
      throw new AppError("Invalid Category ID or Category does not belong to this shop", 400);
    }
  }

  if (data.supplierId) {
    const supplier = await Supplier.findOne({
      _id: data.supplierId,
      shopId,
      isDeleted: false,
    });
    if (!supplier) {
      throw new AppError("Invalid Supplier ID or Supplier does not belong to this shop", 400);
    }
  }

  const updateFields: Partial<IProduct> = {};
  if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId;
  if (data.supplierId !== undefined) updateFields.supplierId = data.supplierId;
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.sku !== undefined) updateFields.sku = data.sku;
  if (data.barcode !== undefined) updateFields.barcode = data.barcode;
  if (data.brand !== undefined) updateFields.brand = data.brand;
  if (data.unit !== undefined) updateFields.unit = data.unit;
  if (data.images !== undefined) updateFields.images = data.images;
  if (data.expiryDate !== undefined) updateFields.expiryDate = data.expiryDate;
  if (data.manufactureDate !== undefined) updateFields.manufactureDate = data.manufactureDate;
  if (data.isActive !== undefined) updateFields.isActive = data.isActive;

  const purchasePrice =
    data.purchasePrice !== undefined ? data.purchasePrice : existing.purchasePrice;
  const sellingPrice =
    data.sellingPrice !== undefined ? data.sellingPrice : existing.sellingPrice;

  if (data.purchasePrice !== undefined || data.sellingPrice !== undefined) {
    updateFields.purchasePrice = purchasePrice;
    updateFields.sellingPrice = sellingPrice;
    updateFields.profitMargin = calculateProfitMargin(purchasePrice, sellingPrice);
  }

  if (
    data.currentStock !== undefined ||
    data.reorderLevel !== undefined
  ) {
    const currentStock =
      data.currentStock !== undefined ? data.currentStock : existing.currentStock;
    const reorderLevel =
      data.reorderLevel !== undefined ? data.reorderLevel : existing.reorderLevel;
    updateFields.currentStock = currentStock;
    updateFields.reorderLevel = reorderLevel;
    if (data.status === undefined) {
      updateFields.status = determineStatus(currentStock, reorderLevel);
    }
  }

  if (data.status !== undefined) {
    updateFields.status = data.status;
  }

  if (data.minimumStock !== undefined) updateFields.minimumStock = data.minimumStock;
  if (data.maximumStock !== undefined) updateFields.maximumStock = data.maximumStock;

  const product = await Product.findOneAndUpdate(
    { _id: productId, shopId, isDeleted: false },
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const deleteProduct = async (
  shopId: string,
  productId: string,
): Promise<void> => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, shopId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false, status: ProductStatus.DISCONTINUED } },
    { new: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }
};

export const updateStock = async (
  shopId: string,
  productId: string,
  newStock: number,
): Promise<IProduct> => {
  const product = await Product.findOne({
    _id: productId,
    shopId,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const status = determineStatus(newStock, product.reorderLevel);

  const updated = await Product.findOneAndUpdate(
    { _id: productId, shopId, isDeleted: false },
    { $set: { currentStock: newStock, status } },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw new AppError("Product not found", 404);
  }

  return updated;
};

export const getProductStatistics = async (
  shopId: string,
): Promise<ProductStatistics> => {
  const baseFilter = { shopId, isDeleted: false };

  const [
    totalProducts,
    activeProducts,
    outOfStock,
    lowStockProducts,
    inventoryAggregation,
  ] = await Promise.all([
    Product.countDocuments(baseFilter),
    Product.countDocuments({ ...baseFilter, status: ProductStatus.ACTIVE }),
    Product.countDocuments({ ...baseFilter, currentStock: { $lte: 0 } }),
    Product.countDocuments({
      ...baseFilter,
      currentStock: { $gt: 0 },
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
    }),
    Product.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalInventoryValue: {
            $sum: { $multiply: ["$currentStock", "$purchasePrice"] },
          },
          averageProfitMargin: { $avg: "$profitMargin" },
        },
      },
    ]),
  ]);

  const totalInventoryValue =
    inventoryAggregation.length > 0
      ? Number(inventoryAggregation[0].totalInventoryValue.toFixed(2))
      : 0;
  const averageProfitMargin =
    inventoryAggregation.length > 0
      ? Number(inventoryAggregation[0].averageProfitMargin.toFixed(2))
      : 0;

  return {
    totalProducts,
    activeProducts,
    outOfStock,
    lowStock: lowStockProducts,
    totalInventoryValue,
    averageProfitMargin,
  };
};

export const getLowStockProducts = async (
  shopId: string,
): Promise<IProduct[]> => {
  return await Product.find({
    shopId,
    isDeleted: false,
    currentStock: { $gt: 0 },
    $expr: { $lte: ["$currentStock", "$reorderLevel"] },
  })
    .populate("categoryId", "name color icon")
    .populate("supplierId", "name company")
    .sort({ currentStock: 1 });
};

export const getOutOfStockProducts = async (
  shopId: string,
): Promise<IProduct[]> => {
  return await Product.find({
    shopId,
    isDeleted: false,
    currentStock: { $lte: 0 },
  })
    .populate("categoryId", "name color icon")
    .populate("supplierId", "name company")
    .sort({ createdAt: -1 });
};
