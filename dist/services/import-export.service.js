"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDataPDF = exports.exportData = exports.parseAndImport = exports.importSuppliers = exports.importCategories = exports.importProducts = void 0;
const mongoose_1 = require("mongoose");
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const Supplier_1 = require("../models/Supplier");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
const index_2 = require("../enums/index");
// ─── CSV Parsing ───────────────────────────────────────────────────
const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
};
const parseCSV = (buffer) => {
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
        return [];
    const headers = parseCSVLine(lines[0]).map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
        });
        rows.push(row);
    }
    return rows;
};
// ─── Excel Parsing ─────────────────────────────────────────────────
const parseExcel = async (buffer) => {
    const workbook = new exceljs_1.default.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2)
        return [];
    const headerRow = sheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || "").trim();
    });
    const rows = [];
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1)
            return;
        const record = {};
        headers.forEach((h, idx) => {
            const cell = row.getCell(idx + 1);
            record[h] = String(cell.value ?? "").trim();
        });
        rows.push(record);
    });
    return rows;
};
// ─── Validation ────────────────────────────────────────────────────
const toNum = (val, fallback) => {
    if (!val || val === "")
        return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
};
const validateProducts = (rows, existingSkus, existingBarcodes, categoryIdMap, supplierIdMap) => {
    const valid = [];
    const errors = [];
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
        if (sku)
            existingSkus.add(sku);
        const barcode = row.barcode ? row.barcode.trim() : "";
        if (barcode && existingBarcodes.has(barcode)) {
            errors.push({ row: rowNum, field: "barcode", message: `Barcode "${barcode}" already exists` });
            return;
        }
        if (barcode)
            existingBarcodes.add(barcode);
        let categoryId;
        if (row.categoryId) {
            const mapped = categoryIdMap.get(row.categoryId.trim());
            if (!mapped) {
                errors.push({ row: rowNum, field: "categoryId", message: `Category "${row.categoryId}" not found` });
                return;
            }
            categoryId = mapped;
        }
        let supplierId;
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
const validateCategories = (rows, existingNames) => {
    const valid = [];
    const errors = [];
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
const validateSuppliers = (rows, existingNames) => {
    const valid = [];
    const errors = [];
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
const generateSku = (name) => {
    const prefix = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};
const determineStatus = (currentStock, reorderLevel) => {
    if (currentStock <= 0)
        return index_2.ProductStatus.OUT_OF_STOCK;
    if (currentStock <= reorderLevel)
        return index_2.ProductStatus.LOW_STOCK;
    return index_2.ProductStatus.ACTIVE;
};
const importProducts = async (shopId, rows) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const [existingProducts, categories, suppliers] = await Promise.all([
        Product_1.Product.find({ shopId: shopObjectId, isDeleted: false }).select("sku barcode"),
        Category_1.Category.find({ shopId: shopObjectId, isDeleted: false }).select("_id name"),
        Supplier_1.Supplier.find({ shopId: shopObjectId, isDeleted: false }).select("_id name"),
    ]);
    const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));
    const existingBarcodes = new Set(existingProducts.filter((p) => p.barcode).map((p) => p.barcode));
    const categoryIdMap = new Map();
    const categoryNameMap = new Map();
    for (const c of categories) {
        categoryIdMap.set(String(c._id), String(c._id));
        categoryNameMap.set(c.name.toLowerCase(), String(c._id));
    }
    const supplierIdMap = new Map();
    const supplierNameMap = new Map();
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
            await Product_1.Product.create({
                shopId: shopObjectId,
                categoryId: categoryId ? new mongoose_1.Types.ObjectId(categoryId) : categories[0]?._id,
                supplierId: supplierId ? new mongoose_1.Types.ObjectId(supplierId) : suppliers[0]?._id,
                name: item.name,
                description: item.description || "",
                sku,
                barcode: item.barcode || "",
                brand: item.brand || "",
                purchasePrice: item.purchasePrice,
                sellingPrice: item.sellingPrice,
                profitMargin: item.purchasePrice > 0
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
        }
        catch {
            errors.push({ row: 0, field: "database", message: `Failed to insert product "${item.name}"` });
        }
    }
    return { totalRows: rows.length, successful, failed: errors.length, errors };
};
exports.importProducts = importProducts;
const importCategories = async (shopId, rows) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const existing = await Category_1.Category.find({ shopId: shopObjectId, isDeleted: false }).select("name");
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
    const { valid, errors } = validateCategories(rows, existingNames);
    let successful = 0;
    for (const item of valid) {
        try {
            await Category_1.Category.create({
                shopId: shopObjectId,
                name: item.name,
                description: item.description || "",
                color: item.color || "#000000",
                icon: item.icon || "default-icon",
                isActive: true,
                isDeleted: false,
            });
            successful++;
        }
        catch {
            errors.push({ row: 0, field: "database", message: `Failed to insert category "${item.name}"` });
        }
    }
    return { totalRows: rows.length, successful, failed: errors.length, errors };
};
exports.importCategories = importCategories;
const importSuppliers = async (shopId, rows) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    const existing = await Supplier_1.Supplier.find({ shopId: shopObjectId, isDeleted: false }).select("name");
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
    const { valid, errors } = validateSuppliers(rows, existingNames);
    let successful = 0;
    for (const item of valid) {
        try {
            await Supplier_1.Supplier.create({
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
        }
        catch {
            errors.push({ row: 0, field: "database", message: `Failed to insert supplier "${item.name}"` });
        }
    }
    return { totalRows: rows.length, successful, failed: errors.length, errors };
};
exports.importSuppliers = importSuppliers;
// ─── Parse & Import Dispatcher ─────────────────────────────────────
const parseAndImport = async (shopId, entityType, fileBuffer, fileName) => {
    let rows;
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    if (isExcel) {
        rows = await parseExcel(fileBuffer);
    }
    else {
        rows = parseCSV(fileBuffer);
    }
    if (rows.length === 0) {
        throw new AppError_1.AppError("No data rows found in the file", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    switch (entityType) {
        case "products":
            return (0, exports.importProducts)(shopId, rows);
        case "categories":
            return (0, exports.importCategories)(shopId, rows);
        case "suppliers":
            return (0, exports.importSuppliers)(shopId, rows);
        default:
            throw new AppError_1.AppError("Invalid entity type", index_1.HTTP_STATUS.BAD_REQUEST);
    }
};
exports.parseAndImport = parseAndImport;
// ─── Export Logic ──────────────────────────────────────────────────
const productToRow = (p) => ({
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
const categoryToRow = (c) => ({
    name: c.name,
    description: c.description,
    color: c.color,
    icon: c.icon,
    isActive: c.isActive,
    createdAt: new Date(c.createdAt).toISOString().split("T")[0],
});
const supplierToRow = (s) => ({
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
const exportData = async (shopId, entityType, format) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    let rows = [];
    let headers = [];
    let entityLabel = "";
    if (entityType === "products") {
        entityLabel = "Products";
        const items = await Product_1.Product.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        rows = items.map(productToRow);
        headers = Object.keys(rows[0] || {});
    }
    else if (entityType === "categories") {
        entityLabel = "Categories";
        const items = await Category_1.Category.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        rows = items.map(categoryToRow);
        headers = Object.keys(rows[0] || {});
    }
    else if (entityType === "suppliers") {
        entityLabel = "Suppliers";
        const items = await Supplier_1.Supplier.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        rows = items.map(supplierToRow);
        headers = Object.keys(rows[0] || {});
    }
    if (rows.length === 0) {
        throw new AppError_1.AppError(`No ${entityType} to export`, index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (format === "csv") {
        return exportCSV(rows, headers, entityLabel);
    }
    if (format === "excel") {
        return exportExcel(rows, headers, entityLabel);
    }
    return exportPDF(rows, headers, entityLabel);
};
exports.exportData = exportData;
// ─── CSV Export ────────────────────────────────────────────────────
const exportCSV = (rows, headers, label) => {
    const escapeCSV = (val) => {
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
const exportExcel = async (rows, headers, label) => {
    const workbook = new exceljs_1.default.Workbook();
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
const exportPDF = (rows, headers, label) => {
    const doc = new pdfkit_1.default({ size: "A4", layout: "landscape", margin: 30 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
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
const exportDataPDF = async (shopId, entityType) => {
    const shopObjectId = new mongoose_1.Types.ObjectId(shopId);
    let rows = [];
    let headers = [];
    let entityLabel = "";
    if (entityType === "products") {
        entityLabel = "Products";
        const items = await Product_1.Product.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        rows = items.map(productToRow);
    }
    else if (entityType === "categories") {
        entityLabel = "Categories";
        const items = await Category_1.Category.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        rows = items.map(categoryToRow);
    }
    else if (entityType === "suppliers") {
        entityLabel = "Suppliers";
        const items = await Supplier_1.Supplier.find({ shopId: shopObjectId, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        rows = items.map(supplierToRow);
    }
    if (rows.length === 0) {
        throw new AppError_1.AppError(`No ${entityType} to export`, index_1.HTTP_STATUS.NOT_FOUND);
    }
    headers = Object.keys(rows[0] || {});
    const doc = new pdfkit_1.default({ size: "A4", layout: "landscape", margin: 30 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
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
    const buffer = await new Promise((resolve, reject) => {
        const bufs = [];
        doc.on("data", (chunk) => bufs.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(bufs)));
        doc.on("error", reject);
    });
    return {
        data: buffer,
        contentType: "application/pdf",
        fileName: `${entityLabel.toLowerCase()}-export.pdf`,
    };
};
exports.exportDataPDF = exportDataPDF;
//# sourceMappingURL=import-export.service.js.map