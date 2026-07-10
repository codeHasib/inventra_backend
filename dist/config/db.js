"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDatabase = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not defined in environment variables");
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        logger_1.logger.info("MongoDB connected successfully");
    }
    catch (error) {
        logger_1.logger.error(`MongoDB connection failed: ${error}`);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=db.js.map