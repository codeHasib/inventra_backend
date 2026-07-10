import mongoose from "mongoose";
import { logger } from "../utils/logger";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error}`);
    process.exit(1);
  }
};
