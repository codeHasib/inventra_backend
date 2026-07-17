import { logger } from "../utils/logger";

let authInstance: any = null;

export async function getAuth() {
  if (authInstance) return authInstance;

  const { betterAuth } = await import("better-auth");
  const { mongodbAdapter } = await import("better-auth/adapters/mongodb");
  const { MongoClient } = await import("mongodb");

  const MONGODB_URI = process.env.MONGODB_URI;
  const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

  if (!BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const client = new MongoClient(MONGODB_URI);
  const db = client.db("inventraAI");

  authInstance = betterAuth({
    baseURL:
      process.env.BETTER_AUTH_URL ||
      "https://inventra-backend-mu.vercel.app",
    database: mongodbAdapter(db, {
      client,
      usePlural: false,
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: BETTER_AUTH_SECRET,
    trustedOrigins: [
      "https://inventra-ai.netlify.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
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

  logger.info("better-auth instance initialized");
  return authInstance;
}
