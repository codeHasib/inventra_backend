import { Types } from "mongoose";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Product, IProduct } from "../models/Product";
import { Category, ICategory } from "../models/Category";
import { Supplier, ISupplier } from "../models/Supplier";
import { AppError } from "../utils/AppError";
import { HTTP_STATUS } from "../constants/index";
import { ProductStatus } from "../enums/index";

// ─── Types ─────────────────────────────────────────────────────────

export type EntityType = "products" | "categories" | "suppliers";
export type ExportFormat = "csv" | "excel" | "pdf";

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportSummary {
  totalRows: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

interface ProductRow {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  categoryId?: string;
  supplierId?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderLevel?: number;
  unit?: string;
}

interface CategoryRow {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface SupplierRow {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  tradeLicense?: string;
  notes?: string;
}

// ─── CSV Parsing ───────────────────────────────────────────────────

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const parseCSV = (buffer: Buffer): Record<string, string>[] => {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
};

// ─── Excel Parsing ─────────────────────────────────────────────────

const parseExcel = async (buffer: Buffer<ArrayBufferLike>): Promise<Record<string, string>[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || "").trim();
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const cell = row.getCell(idx + 1);
      record[h] = String(cell.value ?? "").trim();
    });
    rows.push(record);
  });

  return rows;
};

// ─── Validation ────────────────────────────────────────────────────

const toNum = (val: string | undefined, fallback: number): number => {
  if (!val || val === "") return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

const validateProducts = (
  rows: Record<string, string>[],
  existingSkus: Set<string>,
  existingBarcodes: Set<string>,
  categoryIdMap: Map<string, string>,
  supplierIdMap: Map<string, string>,
): { valid: ProductRow[]; errors: ImportError[] } => {
  const valid: ProductRow[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (!row.name || row.name.trim() === "") {
      errors.push({ row: rowNum, field: "name", message: "Name is required" });
      return;
    }
    if (!row.purchasePrice || isNaN(Number(row.purchasePrice))) {
      errors.push({ row: rowNum, field: "purchasePrice", message: "Valid purchasePrice is required" });
      return;
    }
    if (!row.sellingPrice || isNaN(Number(row.sellingPrice))) {
      errors.push({ row: rowNum, field: "sellingPrice", message: "Valid sellingPrice is required" });
      return;
    }

    const sku = row.sku ? row.sku.trim().toUpperCase() : "";
    if (sku && existingSkus.has(sku)) {
      errors.push({ row: rowNum, field: "sku", message: `SKU "${sku}" already exists` });
      return;
    }
    if (sku) existingSkus.add(sku);

    const barcode = row.barcode ? row.barcode.trim() : "";
    if (barcode && existingBarcodes.has(barcode)) {
      errors.push({ row: rowNum, field: "barcode", message: `Barcode "${barcode}" already exists` });
      return;
    }
    if (barcode) existingBarcodes.add(barcode);

    let categoryId: string | undefined;
    if (row.categoryId) {
      const mapped = categoryIdMap.get(row.categoryId.trim());
      if (!mapped) {
        errors.push({ row: rowNum, field: "categoryId", message: `Category "${row.categoryId}" not found` });
        return;
      }
      categoryId = mapped;
    }

    let supplierId: string | undefined;
    if (row.supplierId) {
      const mapped = supplierIdMap.get(row.supplierId.trim());
      if (!mapped) {
        errors.push({ row: rowNum, field: "supplierId", message: `Supplier "${row.supplierId}" not found` });
        return;
      }
      supplierId = mapped;
    }

    valid.push({
      name: row.name.trim(),
      description: row.description?.trim() || "",
      sku: sku || undefined,
      barcode: barcode || undefined,
      brand: row.brand?.trim() || "",
      categoryId,
      supplierId,
      purchasePrice: Number(row.purchasePrice),
      sellingPrice: Number(row.sellingPrice),
      currentStock: toNum(row.currentStock, 0),
      minimumStock: toNum(row.minimumStock, 5),
      maximumStock: toNum(row.maximumStock, 1000),
      reorderLevel: toNum(row.reorderLevel, 10),
      unit: row.unit?.trim() || "pcs",
    });
  });

  return { valid, errors };
};

const validateCategories = (
  rows: Record<string, string>[],
  existingNames: Set<string>,
): { valid: CategoryRow[]; errors: ImportError[] } => {
  const valid: CategoryRow[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (!row.name || row.name.trim() === "") {
      errors.push({ row: rowNum, field: "name", message: "Name is required" });
      return;
    }

    const name = row.name.trim();
    if (existingNames.has(name.toLowerCase())) {
      errors.push({ row: rowNum, field: "name", message: `Category "${name}" already exists` });
      return;
    }
    existingNames.add(name.toLowerCase());

    valid.push({
      name,
      description: row.description?.trim() || "",
      color: row.color?.trim() || "#000000",
      icon: row.icon?.trim() || "default-icon",
    });
  });

  return { valid, errors };
};

const validateSuppliers = (
  rows: Record<string, string>[],
  existingNames: Set<string>,
): { valid: SupplierRow[]; errors: ImportError[] } => {
  const valid: SupplierRow[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (!row.name || row.name.trim() === "") {
      errors.push({ row: rowNum, field: "name", message: "Name is required" });
      return;
    }
    if (!row.phone || row.phone.trim() === "") {
      errors.push({ row: rowNum, field: "phone", message: "Phone is required" });
      return;
    }

    const name = row.name.trim();
    if (existingNames.has(name.toLowerCase())) {
      errors.push({ row: rowNum, field: "name", message: `Supplier "${name}" already exists` });
      return;
    }
    existingNames.add(name.toLowerCase());

    valid.push({
      name,
      company: row.company?.trim() || "",
      phone: row.phone.trim(),
      email: row.email?.trim() || "",
      address: row.address?.trim() || "",
      tradeLicense: row.tradeLicense?.trim() || "",
      notes: row.notes?.trim() || "",
    });
  });

  return { valid, errors };
};

// ─── Import Logic ──────────────────────────────────────────────────

const generateSku = (name: string): string => {
  const prefix = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const determineStatus = (currentStock: number, reorderLevel: number): ProductStatus => {
  if (currentStock <= 0) return ProductStatus.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return ProductStatus.LOW_STOCK;
  return ProductStatus.ACTIVE;
};

export const importProducts = async (
  shopId: string,
  rows: Record<string, string>[],
): Promise<ImportSummary> => {
  const shopObjectId = new Types.ObjectId(shopId);

  const [existingProducts, categories, suppliers] = await Promise.all([
    Product.find({ shopId: shopObjectId, isDeleted: false }).select("sku barcode"),
    Category.find({ shopId: shopObjectId, isDeleted: false }).select("_id name"),
    Supplier.find({ shopId: shopObjectId, isDeleted: false }).select("_id name"),
  ]);

  const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));
  const existingBarcodes = new Set(existingProducts.filter((p) => p.barcode).map((p) => p.barcode as string));

  const categoryIdMap = new Map<string, string>();
  const categoryNameMap = new Map<string, string>();
  for (const c of categories) {
    categoryIdMap.set(String(c._id), String(c._id));
    categoryNameMap.set(c.name.toLowerCase(), String(c._id));
  }

  const supplierIdMap = new Map<string, string>();
  const supplierNameMap = new Map<string, string>();
  for (const s of suppliers) {
    supplierIdMap.set(String(s._id), String(s._id));
    supplierNameMap.set(s.name.toLowerCase(), String(s._id));
  }

  const { valid, errors } = validateProducts(rows, existingSkus, existingBarcodes, categoryIdMap, supplierIdMap);

  let successful = 0;
  for (const item of valid) {
    let categoryId = item.categoryId;
    if (!categoryId && categories.length > 0) {
      categoryId = String(categories[0]._id);
    }
    let supplierId = item.supplierId;
    if (!supplierId && suppliers.length > 0) {
      supplierId = String(suppliers[0]._id);
    }

    const sku = item.sku || generateSku(item.name);
    const currentStock = item.currentStock ?? 0;
    const reorderLevel = item.reorderLevel ?? 10;

    try {
      await Product.create({
        shopId: shopObjectId,
        categoryId: categoryId ? new Types.ObjectId(categoryId) : categories[0]?._id,
        supplierId: supplierId ? new Types.ObjectId(supplierId) : suppliers[0]?._id,
        name: item.name,
        description: item.description || "",
        sku,
        barcode: item.barcode || "",
        brand: item.brand || "",
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        profitMargin:
          item.purchasePrice > 0
            ? Number((((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100).toFixed(2))
            : 0,
        currentStock,
        minimumStock: item.minimumStock ?? 5,
        maximumStock: item.maximumStock ?? 1000,
        reorderLevel,
        unit: item.unit || "pcs",
        images: [],
        status: determineStatus(currentStock, reorderLevel),
        isActive: true,
        isDeleted: false,
      });
      successful++;
    } catch {
      errors.push({ row: 0, field: "database", message: `Failed to insert product "${item.name}"` });
    }
  }

  return { totalRows: rows.length, successful, failed: errors.length, errors };
};

export const importCategories = async (
  shopId: string,
  rows: Record<string, string>[],
): Promise<ImportSummary> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const existing = await Category.find({ shopId: shopObjectId, isDeleted: false }).select("name");
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

  const { valid, errors } = validateCategories(rows, existingNames);

  let successful = 0;
  for (const item of valid) {
    try {
      await Category.create({
        shopId: shopObjectId,
        name: item.name,
        description: item.description || "",
        color: item.color || "#000000",
        icon: item.icon || "default-icon",
        isActive: true,
        isDeleted: false,
      });
      successful++;
    } catch {
      errors.push({ row: 0, field: "database", message: `Failed to insert category "${item.name}"` });
    }
  }

  return { totalRows: rows.length, successful, failed: errors.length, errors };
};

export const importSuppliers = async (
  shopId: string,
  rows: Record<string, string>[],
): Promise<ImportSummary> => {
  const shopObjectId = new Types.ObjectId(shopId);
  const existing = await Supplier.find({ shopId: shopObjectId, isDeleted: false }).select("name");
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

  const { valid, errors } = validateSuppliers(rows, existingNames);

  let successful = 0;
  for (const item of valid) {
    try {
      await Supplier.create({
        shopId: shopObjectId,
        name: item.name,
        company: item.company || "",
        phone: item.phone,
        email: item.email || "",
        address: item.address || "",
        tradeLicense: item.tradeLicense || "",
        notes: item.notes || "",
        isActive: true,
        isDeleted: false,
      });
      successful++;
    } catch {
      errors.push({ row: 0, field: "database", message: `Failed to insert supplier "${item.name}"` });
    }
  }

  return { totalRows: rows.length, successful, failed: errors.length, errors };
};

// ─── Parse & Import Dispatcher ─────────────────────────────────────

export const parseAndImport = async (
  shopId: string,
  entityType: EntityType,
  fileBuffer: Buffer,
  fileName: string,
): Promise<ImportSummary> => {
  let rows: Record<string, string>[];
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

  if (isExcel) {
    rows = await parseExcel(fileBuffer);
  } else {
    rows = parseCSV(fileBuffer);
  }

  if (rows.length === 0) {
    throw new AppError("No data rows found in the file", HTTP_STATUS.BAD_REQUEST);
  }

  switch (entityType) {
    case "products":
      return importProducts(shopId, rows);
    case "categories":
      return importCategories(shopId, rows);
    case "suppliers":
      return importSuppliers(shopId, rows);
    default:
      throw new AppError("Invalid entity type", HTTP_STATUS.BAD_REQUEST);
  }
};

// ─── Export Logic ──────────────────────────────────────────────────

const productToRow = (p: IProduct) => ({
  name: p.name,
  description: p.description,
  sku: p.sku,
  barcode: p.barcode,
  brand: p.brand,
  purchasePrice: p.purchasePrice,
  sellingPrice: p.sellingPrice,
  profitMargin: p.profitMargin,
  currentStock: p.currentStock,
  minimumStock: p.minimumStock,
  maximumStock: p.maximumStock,
  reorderLevel: p.reorderLevel,
  unit: p.unit,
  status: p.status,
  expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split("T")[0] : "",
  createdAt: new Date(p.createdAt).toISOString().split("T")[0],
});

const categoryToRow = (c: ICategory) => ({
  name: c.name,
  description: c.description,
  color: c.color,
  icon: c.icon,
  isActive: c.isActive,
  createdAt: new Date(c.createdAt).toISOString().split("T")[0],
});

const supplierToRow = (s: ISupplier) => ({
  name: s.name,
  company: s.company,
  phone: s.phone,
  email: s.email,
  address: s.address,
  tradeLicense: s.tradeLicense,
  notes: s.notes,
  isActive: s.isActive,
  createdAt: new Date(s.createdAt).toISOString().split("T")[0],
});

export const exportData = async (
  shopId: string,
  entityType: EntityType,
  format: ExportFormat,
): Promise<{ data: Buffer; contentType: string; fileName: string }> => {
  const shopObjectId = new Types.ObjectId(shopId);
  let rows: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let entityLabel = "";

  if (entityType === "products") {
    entityLabel = "Products";
    const items = await Product.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    rows = items.map(productToRow);
    headers = Object.keys(rows[0] || {});
  } else if (entityType === "categories") {
    entityLabel = "Categories";
    const items = await Category.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    rows = items.map(categoryToRow);
    headers = Object.keys(rows[0] || {});
  } else if (entityType === "suppliers") {
    entityLabel = "Suppliers";
    const items = await Supplier.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    rows = items.map(supplierToRow);
    headers = Object.keys(rows[0] || {});
  }

  if (rows.length === 0) {
    throw new AppError(`No ${entityType} to export`, HTTP_STATUS.NOT_FOUND);
  }

  if (format === "csv") {
    return exportCSV(rows, headers, entityLabel);
  }
  if (format === "excel") {
    return exportExcel(rows, headers, entityLabel);
  }
  return exportPDF(rows, headers, entityLabel);
};

// ─── CSV Export ────────────────────────────────────────────────────

const exportCSV = (
  rows: Record<string, unknown>[],
  headers: string[],
  label: string,
): { data: Buffer; contentType: string; fileName: string } => {
  const escapeCSV = (val: unknown): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  }

  return {
    data: Buffer.from(lines.join("\n"), "utf-8"),
    contentType: "text/csv",
    fileName: `${label.toLowerCase()}-export.csv`,
  };
};

// ─── Excel Export ──────────────────────────────────────────────────

const exportExcel = async (
  rows: Record<string, unknown>[],
  headers: string[],
  label: string,
): Promise<{ data: Buffer; contentType: string; fileName: string }> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(label);

  sheet.columns = headers.map((h) => ({
    header: h,
    key: h,
    width: Math.max(h.length + 4, 14),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF333333" },
  };
  headerRow.alignment = { horizontal: "center" };

  for (const row of rows) {
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    data: Buffer.from(buffer),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: `${label.toLowerCase()}-export.xlsx`,
  };
};

// ─── PDF Export ────────────────────────────────────────────────────

const exportPDF = (
  rows: Record<string, unknown>[],
  headers: string[],
  label: string,
): { data: Buffer; contentType: string; fileName: string } => {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(16).font("Helvetica-Bold").text(`${label} Export`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(8).font("Helvetica").text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.moveDown(1);

  const pageWidth = doc.page.width - 60;
  const colWidth = Math.max(50, pageWidth / headers.length);
  let y = doc.y;

  // Header row
  doc.font("Helvetica-Bold").fontSize(7);
  headers.forEach((h, i) => {
    doc.text(h, 30 + i * colWidth, y, { width: colWidth - 4, align: "left" });
  });
  y += 16;
  doc.moveTo(30, y).lineTo(30 + pageWidth, y).stroke();
  y += 4;

  // Data rows
  doc.font("Helvetica").fontSize(7);
  for (const row of rows) {
    if (y > doc.page.height - 40) {
      doc.addPage();
      y = 30;
      doc.font("Helvetica-Bold").fontSize(7);
      headers.forEach((h, i) => {
        doc.text(h, 30 + i * colWidth, y, { width: colWidth - 4, align: "left" });
      });
      y += 16;
      doc.moveTo(30, y).lineTo(30 + pageWidth, y).stroke();
      y += 4;
      doc.font("Helvetica").fontSize(7);
    }

    headers.forEach((h, i) => {
      const val = String(row[h] ?? "");
      doc.text(val.substring(0, 30), 30 + i * colWidth, y, { width: colWidth - 4, align: "left" });
    });
    y += 14;
  }

  doc.end();

  return {
    data: Buffer.from([]), // filled by on("end")
    contentType: "application/pdf",
    fileName: `${label.toLowerCase()}-export.pdf`,
  };
};

// PDF export needs the async pattern
export const exportDataPDF = async (
  shopId: string,
  entityType: EntityType,
): Promise<{ data: Buffer; contentType: string; fileName: string }> => {
  const shopObjectId = new Types.ObjectId(shopId);
  let rows: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let entityLabel = "";

  if (entityType === "products") {
    entityLabel = "Products";
    const items = await Product.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    rows = items.map(productToRow);
  } else if (entityType === "categories") {
    entityLabel = "Categories";
    const items = await Category.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    rows = items.map(categoryToRow);
  } else if (entityType === "suppliers") {
    entityLabel = "Suppliers";
    const items = await Supplier.find({ shopId: shopObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    rows = items.map(supplierToRow);
  }

  if (rows.length === 0) {
    throw new AppError(`No ${entityType} to export`, HTTP_STATUS.NOT_FOUND);
  }
  headers = Object.keys(rows[0] || {});

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(16).font("Helvetica-Bold").text(`${entityLabel} Export`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(8).font("Helvetica").text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.moveDown(1);

  const pageWidth = doc.page.width - 60;
  const colWidth = Math.max(50, pageWidth / headers.length);
  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(7);
  headers.forEach((h, i) => {
    doc.text(h, 30 + i * colWidth, y, { width: colWidth - 4, align: "left" });
  });
  y += 16;
  doc.moveTo(30, y).lineTo(30 + pageWidth, y).stroke();
  y += 4;

  doc.font("Helvetica").fontSize(7);
  for (const row of rows) {
    if (y > doc.page.height - 40) {
      doc.addPage();
      y = 30;
      doc.font("Helvetica-Bold").fontSize(7);
      headers.forEach((h, i) => {
        doc.text(h, 30 + i * colWidth, y, { width: colWidth - 4, align: "left" });
      });
      y += 16;
      doc.moveTo(30, y).lineTo(30 + pageWidth, y).stroke();
      y += 4;
      doc.font("Helvetica").fontSize(7);
    }

    headers.forEach((h, i) => {
      const val = String(row[h] ?? "");
      doc.text(val.substring(0, 30), 30 + i * colWidth, y, { width: colWidth - 4, align: "left" });
    });
    y += 14;
  }

  doc.end();

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const bufs: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => bufs.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(bufs)));
    doc.on("error", reject);
  });

  return {
    data: buffer,
    contentType: "application/pdf",
    fileName: `${entityLabel.toLowerCase()}-export.pdf`,
  };
};
