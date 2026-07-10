const formatLog = (level: string, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}]: ${message}`;
};

export const logger = {
  info: (message: string): void => {
    console.log(formatLog("INFO", message));
  },
  warn: (message: string): void => {
    console.warn(formatLog("WARN", message));
  },
  error: (message: string): void => {
    console.error(formatLog("ERROR", message));
  },
  debug: (message: string): void => {
    console.debug(formatLog("DEBUG", message));
  },
};
