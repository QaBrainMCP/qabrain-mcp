import type { LogLevel } from "./environment.js";

export function buildLoggerConfig(env: Record<string, string | undefined>) {
    return {
        level: normalizeLogLevel(env.LOG_LEVEL),
        pretty: env.NODE_ENV !== "production"
    };
}

function normalizeLogLevel(value: string | undefined): LogLevel {
    switch (value?.toLowerCase()) {
        case "debug":
            return "debug";
        case "warn":
            return "warn";
        case "error":
            return "error";
        case "info":
        default:
            return "info";
    }
}
