"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBarcodeSVG = exports.generateQRSheet = exports.generateBarcodeSheet = exports.generateQRCode = exports.setCustomBarcode = exports.assignBarcode = exports.generateBarcode = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const mongoose_1 = require("mongoose");
const Product_1 = require("../models/Product");
const AppError_1 = require("../utils/AppError");
const index_1 = require("../constants/index");
// ─── Code128 Encoding ──────────────────────────────────────────────
const CODE128_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
const CODE128_PATTERNS = [
    "11011001100", "11001101100", "11001100110", "10010011000",
    "10010001100", "10001001100", "10011001000", "10011000100",
    "10001100100", "11001001000", "11001000100", "11000100100",
    "10110011100", "10011011100", "10011001110", "10111001100",
    "10011101100", "10011100110", "11001110010", "11001011100",
    "11001001110", "11011100100", "11001110100", "11101101110",
    "11101001100", "11100101100", "11100100110", "11101100100",
    "11100110100", "11100110010", "11011011000", "11011000110",
    "11000110110", "10100011000", "10001011000", "10001000110",
    "10110001000", "10001101000", "10001100010", "11010001000",
    "11000101000", "11000100010", "10110111000", "10110001110",
    "10001101110", "10111011000", "10111000110", "10001110110",
    "11101110110", "11010001110", "11000101110", "11011101000",
    "11011100010", "11011101110", "11101011000", "11101000110",
    "11100010110", "11101101000", "11101100010", "11100011010",
    "11101111010", "11001000010", "11110001010", "10100110000",
    "10100001100", "10010110000", "10010000110", "10000101100",
    "10000100110", "10110010000", "10110000100", "10011010000",
    "10011000010", "10000110100", "10000110010", "11000010010",
    "11001010000", "11110111010", "11000010100", "10001111010",
    "10100111100", "10010111100", "10010011110", "10111100100",
    "10011110100", "10011110010", "11110100100", "11110010100",
    "11110010010", "11011011110", "11011110110", "11110110110",
    "10101111000", "10100011110", "10001011110", "10111101000",
    "10111100010", "11110101000", "11110100010", "10111011110",
    "10111101110", "11101011110", "11110101110", "11010000100",
    "11010010000", "11010011100", "1100011101011",
];
const START_CODE_A = 103;
const START_CODE_B = 104;
const START_CODE_C = 105;
const STOP_PATTERN = "11000111010";
function encodeCode128B(text) {
    const codes = [START_CODE_B];
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const index = CODE128_CHARS.indexOf(text[i]);
        if (index === -1)
            continue;
        codes.push(index);
    }
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i++) {
        checksum += codes[i] * i;
    }
    codes.push(checksum % 103);
    return codes;
}
function codesToBits(codes) {
    let bits = "";
    for (const code of codes) {
        bits += CODE128_PATTERNS[code] || "";
    }
    return bits;
}
function generateBarcodeSVG(text, height = 50) {
    const codes = encodeCode128B(text);
    const bits = codesToBits(codes);
    const fullBits = bits + STOP_PATTERN;
    const barWidth = 2;
    const totalWidth = fullBits.length * barWidth;
    const padding = 10;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth + padding * 2}" height="${height + 20}">`;
    let x = padding;
    for (let i = 0; i < fullBits.length; i++) {
        if (fullBits[i] === "1") {
            svg += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
        }
        x += barWidth;
    }
    svg += `<text x="${totalWidth / 2 + padding}" y="${height + 15}" text-anchor="middle" font-size="10" font-family="monospace">${text}</text>`;
    svg += "</svg>";
    return svg;
}
function drawBarcode(doc, text, x, y, w, h) {
    const codes = encodeCode128B(text);
    const bits = codesToBits(codes);
    const fullBits = bits + STOP_PATTERN;
    const barWidth = Math.max(0.5, w / fullBits.length);
    let cx = x;
    for (let i = 0; i < fullBits.length; i++) {
        if (fullBits[i] === "1") {
            doc.rect(cx, y, barWidth, h).fill("black");
        }
        cx += barWidth;
    }
    doc.fontSize(7).font("Courier").text(text, x, y + h + 2, {
        width: w,
        align: "center",
    });
}
// ─── Barcode Assignment ────────────────────────────────────────────
const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString().substring(2, 8);
    return `${timestamp.slice(-8)}${random}`;
};
exports.generateBarcode = generateBarcode;
const assignBarcode = async (shopId, productId) => {
    const product = await Product_1.Product.findOne({
        _id: new mongoose_1.Types.ObjectId(productId),
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    });
    if (!product) {
        throw new AppError_1.AppError("Product not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (product.barcode) {
        throw new AppError_1.AppError("Product already has a barcode. Use update to change it.", index_1.HTTP_STATUS.BAD_REQUEST);
    }
    let barcode = (0, exports.generateBarcode)();
    let exists = await Product_1.Product.findOne({ shopId: new mongoose_1.Types.ObjectId(shopId), barcode, isDeleted: false });
    while (exists) {
        barcode = (0, exports.generateBarcode)();
        exists = await Product_1.Product.findOne({ shopId: new mongoose_1.Types.ObjectId(shopId), barcode, isDeleted: false });
    }
    product.barcode = barcode;
    await product.save();
    return product;
};
exports.assignBarcode = assignBarcode;
const setCustomBarcode = async (shopId, productId, barcode) => {
    const product = await Product_1.Product.findOne({
        _id: new mongoose_1.Types.ObjectId(productId),
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    });
    if (!product) {
        throw new AppError_1.AppError("Product not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    if (barcode !== product.barcode) {
        const existing = await Product_1.Product.findOne({
            shopId: new mongoose_1.Types.ObjectId(shopId),
            barcode,
            isDeleted: false,
        });
        if (existing) {
            throw new AppError_1.AppError("A product with this barcode already exists in this shop", index_1.HTTP_STATUS.BAD_REQUEST);
        }
    }
    product.barcode = barcode;
    await product.save();
    return product;
};
exports.setCustomBarcode = setCustomBarcode;
// ─── QR Code Generation ────────────────────────────────────────────
const generateQRCode = async (shopId, productId) => {
    const product = await Product_1.Product.findOne({
        _id: new mongoose_1.Types.ObjectId(productId),
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    }).select("name sku barcode brand sellingPrice currentStock unit");
    if (!product) {
        throw new AppError_1.AppError("Product not found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    const qrData = JSON.stringify({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        brand: product.brand,
        price: product.sellingPrice,
        stock: product.currentStock,
        unit: product.unit,
    });
    const buffer = await qrcode_1.default.toBuffer(qrData, {
        type: "png",
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
    });
    return buffer;
};
exports.generateQRCode = generateQRCode;
// ─── Printable Barcode Sheet (PDF) ─────────────────────────────────
const generateBarcodeSheet = async (shopId, productIds, options) => {
    const labelsPerRow = options?.labelsPerRow || 3;
    const showPrice = options?.showPrice !== false;
    const showName = options?.showName !== false;
    const objectIds = productIds.map((id) => new mongoose_1.Types.ObjectId(id));
    const products = await Product_1.Product.find({
        _id: { $in: objectIds },
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    }).select("name sku barcode sellingPrice");
    if (products.length === 0) {
        throw new AppError_1.AppError("No products found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    const noBarcode = products.filter((p) => !p.barcode);
    if (noBarcode.length > 0) {
        throw new AppError_1.AppError(`Products without barcodes: ${noBarcode.map((p) => p.name).join(", ")}. Assign barcodes first.`, index_1.HTTP_STATUS.BAD_REQUEST);
    }
    const doc = new pdfkit_1.default({ size: "A4", margin: 20 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const pageWidth = doc.page.width - 40;
    const labelWidth = pageWidth / labelsPerRow;
    const labelHeight = 120;
    const labelsPerPage = labelsPerRow * Math.floor((doc.page.height - 40) / labelHeight);
    let col = 0;
    let row = 0;
    for (const product of products) {
        const x = 20 + col * labelWidth;
        const y = 20 + row * labelHeight;
        doc.save();
        doc.rect(x, y, labelWidth - 4, labelHeight - 4).lineWidth(0.5).stroke("#CCCCCC");
        if (showName) {
            doc.fontSize(8).font("Helvetica-Bold").text(product.name, x + 4, y + 4, {
                width: labelWidth - 12,
                height: 14,
                ellipsis: true,
            });
        }
        const barcodeY = showName ? y + 20 : y + 4;
        drawBarcode(doc, product.barcode || "", x + 4, barcodeY, labelWidth - 12, 30);
        const textY = barcodeY + 46;
        doc.fontSize(7).font("Courier").text(`SKU: ${product.sku}`, x + 4, textY, {
            width: labelWidth - 12,
        });
        if (showPrice) {
            doc.fontSize(7).font("Helvetica").text(`$${product.sellingPrice.toFixed(2)}`, x + 4, textY + 10, {
                width: labelWidth - 12,
            });
        }
        doc.restore();
        col++;
        if (col >= labelsPerRow) {
            col = 0;
            row++;
            if (row >= Math.floor((doc.page.height - 40) / labelHeight)) {
                doc.addPage();
                row = 0;
            }
        }
    }
    doc.end();
    return new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
};
exports.generateBarcodeSheet = generateBarcodeSheet;
// ─── QR Sheet (PDF) ────────────────────────────────────────────────
const generateQRSheet = async (shopId, productIds, options) => {
    const labelsPerRow = options?.labelsPerRow || 3;
    const showName = options?.showName !== false;
    const showPrice = options?.showPrice !== false;
    const objectIds = productIds.map((id) => new mongoose_1.Types.ObjectId(id));
    const products = await Product_1.Product.find({
        _id: { $in: objectIds },
        shopId: new mongoose_1.Types.ObjectId(shopId),
        isDeleted: false,
    }).select("name sku barcode brand sellingPrice currentStock unit");
    if (products.length === 0) {
        throw new AppError_1.AppError("No products found", index_1.HTTP_STATUS.NOT_FOUND);
    }
    const qrBuffers = [];
    for (const product of products) {
        const qrData = JSON.stringify({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            brand: product.brand,
            price: product.sellingPrice,
            stock: product.currentStock,
            unit: product.unit,
        });
        const qr = await qrcode_1.default.toBuffer(qrData, {
            type: "png",
            width: 150,
            margin: 1,
        });
        qrBuffers.push({ product, qr });
    }
    const doc = new pdfkit_1.default({ size: "A4", margin: 20 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const pageWidth = doc.page.width - 40;
    const cellSize = pageWidth / labelsPerRow;
    const cellHeight = cellSize + 30;
    let col = 0;
    let row = 0;
    for (const { product, qr } of qrBuffers) {
        const x = 20 + col * cellSize;
        const y = 20 + row * cellHeight;
        const imgTop = showName ? y + 14 : y + 4;
        doc.image(qr, x + (cellSize - 100) / 2, imgTop, { width: 100, height: 100 });
        if (showName) {
            doc.fontSize(7).font("Helvetica-Bold").text(product.name, x + 4, y + 4, {
                width: cellSize - 8,
                height: 12,
                ellipsis: true,
                align: "center",
            });
        }
        if (showPrice) {
            doc.fontSize(7).font("Helvetica").text(`$${product.sellingPrice.toFixed(2)}`, x + 4, imgTop + 104, {
                width: cellSize - 8,
                align: "center",
            });
        }
        col++;
        if (col >= labelsPerRow) {
            col = 0;
            row++;
            if (row * cellHeight + cellHeight > doc.page.height - 40) {
                doc.addPage();
                row = 0;
            }
        }
    }
    doc.end();
    return new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
};
exports.generateQRSheet = generateQRSheet;
// ─── Single Barcode SVG ────────────────────────────────────────────
const getBarcodeSVG = (text) => {
    return generateBarcodeSVG(text);
};
exports.getBarcodeSVG = getBarcodeSVG;
//# sourceMappingURL=barcode.service.js.map