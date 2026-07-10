import { connect } from "mongoose";

const logger = {
  info: (msg: string) => process.stdout.write(`[INFO] ${msg}\n`),
  error: (msg: string) => process.stderr.write(`[ERROR] ${msg}\n`),
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not defined in the environment variables",
      );
    }

    const connection = await connect(uri);
    logger.info(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    logger.error(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
};
