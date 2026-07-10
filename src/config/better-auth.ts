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

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;

if (!BETTER_AUTH_URL) {
  logger.warn("BETTER_AUTH_URL is not set. Authentication will fail.");
}

export const verifySession = async (
  cookieHeader: string,
): Promise<BetterAuthSessionResult | null> => {
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
      user: data.user as BetterAuthUser,
      session: data.session as BetterAuthSession,
    };
  } catch (error) {
    logger.error(`Better Auth session verification failed: ${error}`);
    return null;
  }
};
