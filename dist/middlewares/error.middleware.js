"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
const errorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        logger_1.logger.error(`${statusCode}: ${message}`);
    }
    else if (err.code === 11000 ||
        err.name === "MongoServerError") {
        statusCode = 400;
        const duplicateField = Object.keys(err.keyPattern || {}).join(", ");
        message = duplicateField
            ? `A product with this ${duplicateField} already exists.`
            : "A product with this SKU, Slug, or Barcode already exists.";
        logger_1.logger.error(`400 DuplicateKey: ${message}`);
    }
    else {
        logger_1.logger.error(`Unhandled error: ${err.message}`);
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        data: process.env.NODE_ENV === "development" ? err.stack : null,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map