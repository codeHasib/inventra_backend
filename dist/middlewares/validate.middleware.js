"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
const validateRequest = (schema) => {
    return (req, _res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof Error && "issues" in error) {
                const issues = error.issues;
                logger_1.logger.error(`Validation failed: ${JSON.stringify(issues)}`);
                const message = issues
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(", ");
                return next(new AppError_1.AppError(message, 400));
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validate.middleware.js.map