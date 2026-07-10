const timestamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string): void => {
    console.log(`[${timestamp()}] [INFO] ${message}`);
  },
  warn: (message: string): void => {
    console.warn(`[${timestamp()}] [WARN] ${message}`);
  },
  error: (message: string): void => {
    console.error(`[${timestamp()}] [ERROR] ${message}`);
  },
  debug: (message: string): void => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${timestamp()}] [DEBUG] ${message}`);
    }
  },
};
