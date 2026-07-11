import crypto from "crypto";
import mongoose from "mongoose";
import { logger } from "../utils/logger";

export interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  shopId: string | null;
  [key: string]: unknown;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  token: string;
}

export interface BetterAuthSessionResult {
  user: BetterAuthUser;
  session: BetterAuthSession;
}

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

if (!BETTER_AUTH_SECRET) {
  logger.warn(
    "BETTER_AUTH_SECRET is not set. Session verification will fail."
  );
}

const COOKIE_NAME = "inventra.session_token";

function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();
  let index = 0;
  while (index < cookieHeader.length) {
    const eqIdx = cookieHeader.indexOf("=", index);
    if (eqIdx === -1) break;
    let endIdx = cookieHeader.indexOf(";", index);
    if (endIdx === -1) endIdx = cookieHeader.length;
    else if (endIdx < eqIdx) {
      index = cookieHeader.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = cookieHeader.slice(index, eqIdx).trim();
    let val = cookieHeader.slice(eqIdx + 1, endIdx).trim();
    if (val.codePointAt(0) === 34) val = val.slice(1, -1);
    if (!cookies.has(key)) {
      cookies.set(key, decodeURIComponent(val));
    }
    index = endIdx + 1;
  }
  return cookies;
}

function verifyCookieSignature(
  signedValue: string,
  signature: string,
  secret: string
): boolean {
  if (signature.length !== 44 || !signature.endsWith("=")) return false;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedValue)
    .digest("base64");

  const sigBuf = Buffer.from(signature, "base64");
  const expectedBuf = Buffer.from(expectedSig, "base64");

  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

function extractSessionToken(cookieHeader: string): string | null {
  const cookies = parseCookieHeader(cookieHeader);
  const rawValue = cookies.get(COOKIE_NAME);
  if (!rawValue) return null;

  const lastDotIndex = rawValue.lastIndexOf(".");
  if (lastDotIndex < 1) return null;

  const signedValue = rawValue.substring(0, lastDotIndex);
  const signature = rawValue.substring(lastDotIndex + 1);

  if (!verifyCookieSignature(signedValue, signature, BETTER_AUTH_SECRET!)) {
    return null;
  }

  return signedValue;
}

export const verifySession = async (
  cookieHeader: string
): Promise<BetterAuthSessionResult | null> => {
  if (!BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is not configured");
  }

  try {
    const token = extractSessionToken(cookieHeader);
    if (!token) return null;

    const db = mongoose.connection.db;
    if (!db) {
      logger.error("MongoDB connection not available for session verification");
      return null;
    }

    const now = new Date();

    const sessionDoc = await db
      .collection("session")
      .findOne({ token, expiresAt: { $gt: now } });

    if (!sessionDoc) return null;

    const userDoc = await db
      .collection("user")
      .findOne({ _id: sessionDoc.userId });

    if (!userDoc) return null;

    const userId =
      userDoc._id instanceof mongoose.Types.ObjectId
        ? userDoc._id.toHexString()
        : String(userDoc._id);

    const sessionId =
      sessionDoc._id instanceof mongoose.Types.ObjectId
        ? sessionDoc._id.toHexString()
        : String(sessionDoc._id);

    return {
      user: {
        id: userId,
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role || "user",
        shopId: userDoc.shopId || null,
      },
      session: {
        id: sessionId,
        userId,
        expiresAt:
          sessionDoc.expiresAt instanceof Date
            ? sessionDoc.expiresAt.toISOString()
            : String(sessionDoc.expiresAt),
        token: sessionDoc.token,
      },
    };
  } catch (error) {
    logger.error(`Better Auth session verification failed: ${error}`);
    return null;
  }
};
