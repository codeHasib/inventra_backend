"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const timestamp = () => new Date().toISOString();
exports.logger = {
    info: (message) => {
        console.log(`[${timestamp()}] [INFO] ${message}`);
    },
    warn: (message) => {
        console.warn(`[${timestamp()}] [WARN] ${message}`);
    },
    error: (message) => {
        console.error(`[${timestamp()}] [ERROR] ${message}`);
    },
    debug: (message) => {
        if (process.env.NODE_ENV === "development") {
            console.debug(`[${timestamp()}] [DEBUG] ${message}`);
        }
    },
};
//# sourceMappingURL=logger.js.map