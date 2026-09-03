/**
 * Structured Logger and Sentry / Error Monitoring Scaffold
 */

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
  },
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, error?: any, context?: Record<string, any>) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...context,
    });
  },
};
