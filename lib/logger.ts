/**
 * Production-ready structured logger for API routes and server actions.
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

export function log(level: LogLevel, { message, context, error }: LogPayload) {
  const timestamp = new Date().toISOString();
  const errorDetails =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

  const logEntry = {
    timestamp,
    level,
    message,
    ...(context ? { context } : {}),
    ...(errorDetails ? { error: errorDetails } : {}),
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
