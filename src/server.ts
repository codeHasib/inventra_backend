import "dotenv/config";
import { app } from "./app";
import { connectDatabase } from "./config/db";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`Inventra AI server running on port ${PORT}`);
  });

  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("uncaughtException", (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(`Unhandled Rejection: ${String(reason)}`);
    process.exit(1);
  });

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

startServer();
