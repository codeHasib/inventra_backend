import "dotenv/config";
import { app } from "./app";
import { connectDatabase } from "./config/database";

const PORT = process.env.PORT || 5000;

const logger = {
  info: (msg: string) => process.stdout.write(`[INFO] ${msg}\n`),
  error: (msg: string) => process.stderr.write(`[ERROR] ${msg}\n`),
};

export const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`Inventra AI server running on port ${PORT}`);
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.info("Server gracefully closed");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: Error) => {
    logger.error(`Unexpected Error: ${error.message}`);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received");
    if (server) {
      server.close();
    }
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received");
    if (server) {
      server.close();
    }
  });
};

startServer();