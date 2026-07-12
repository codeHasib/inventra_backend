"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const mongodb_1 = require("better-auth/adapters/mongodb");
const mongodb_2 = require("mongodb");
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
if (!BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required");
}
if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
}
const client = new mongodb_2.MongoClient(MONGODB_URI);
const db = client.db();
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, mongodb_1.mongodbAdapter)(db, {
        client,
        usePlural: false,
        transaction: false,
    }),
    secret: BETTER_AUTH_SECRET,
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "staff",
            },
            shopId: {
                type: "string",
            },
        },
    },
});
//# sourceMappingURL=better-auth.js.map