/**
 * Simple logger utility for frontend
 */
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data || "");
    }
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || "");
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || "");
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, data || "");
    }
  },
  authInfo: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH][INFO] ${message}`, data || "");
    }
  },
  authError: (message: string, data?: any) => {
    console.error(`[AUTH][ERROR] ${message}`, data || "");
  },
};

export default logger;

