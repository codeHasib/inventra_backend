"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_middleware_1 = require("./middlewares/error.middleware");
const better_auth_1 = require("./config/better-auth");
const index_1 = __importDefault(require("./routes/index"));
exports.app = (0, express_1.default)();
exports.app.set("trust proxy", 1);
exports.app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
exports.app.use((req, res, next) => {
    const requestedHeaders = req.headers["access-control-request-headers"];
    if (requestedHeaders) {
        res.header("Access-Control-Allow-Headers", requestedHeaders);
    }
    next();
});
exports.app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
exports.app.use((0, compression_1.default)());
let toNodeHandlerFn = null;
let authInitPromise = null;
exports.app.use("/api/auth", async (req, res, next) => {
    if (!toNodeHandlerFn) {
        if (!authInitPromise) {
            authInitPromise = (async () => {
                const auth = await (0, better_auth_1.getAuth)();
                const { toNodeHandler } = await import("better-auth/node");
                toNodeHandlerFn = toNodeHandler(auth);
            })();
        }
        await authInitPromise;
    }
    toNodeHandlerFn(req, res, next);
});
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, morgan_1.default)("dev"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, try again later" },
    skip: (req) => req.originalUrl.startsWith("/api/auth"),
});
exports.app.use("/api", limiter);
exports.app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Inventra AI Backend is running",
        timestamp: new Date().toISOString(),
    });
});
exports.app.use("/api", index_1.default);
exports.app.use((_req, res, _next) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Route not found",
    });
});
exports.app.use(error_middleware_1.errorHandler);
//# sourceMappingURL=app.js.map