"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.NODE_ENV !== "production") {
    import("dotenv").then((dotenv) => dotenv.config());
}
const app_1 = require("./app");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await (0, db_1.connectDatabase)();
    const dbName = (await import("mongoose")).default.connection.db?.databaseName;
    logger_1.logger.info(`Connected to database: ${dbName}`);
    if (process.env.NODE_ENV !== "production") {
        const server = app_1.app.listen(PORT, () => {
            logger_1.logger.info(`Inventra AI server running on port ${PORT}`);
        });
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`${signal} received. Shutting down gracefully...`);
            server.close(() => {
                logger_1.logger.info("Server closed");
                process.exit(0);
            });
        };
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    }
    process.on("uncaughtException", (error) => {
        logger_1.logger.error(`Uncaught Exception: ${error.message}`);
        process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
        logger_1.logger.error(`Unhandled Rejection: ${String(reason)}`);
        process.exit(1);
    });
};
startServer();
//# sourceMappingURL=server.js.map