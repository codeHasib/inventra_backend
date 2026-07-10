"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySession = void 0;
const logger_1 = require("../utils/logger");
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
if (!BETTER_AUTH_URL) {
    logger_1.logger.warn("BETTER_AUTH_URL is not set. Authentication will fail.");
}
const verifySession = async (cookieHeader) => {
    if (!BETTER_AUTH_URL) {
        throw new Error("BETTER_AUTH_URL is not configured");
    }
    try {
        const response = await fetch(`${BETTER_AUTH_URL}/api/auth/get-session`, {
            method: "GET",
            headers: {
                cookie: cookieHeader,
            },
        });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (!data || !data.session || !data.user) {
            return null;
        }
        return {
            user: data.user,
            session: data.session,
        };
    }
    catch (error) {
        logger_1.logger.error(`Better Auth session verification failed: ${error}`);
        return null;
    }
};
exports.verifySession = verifySession;
//# sourceMappingURL=better-auth.js.map