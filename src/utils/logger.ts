import pino from "pino";

import type { Logger } from "pino";

const loggerCache = new Map<string, Logger>();

export function createLogger(level: string = "info", pretty: boolean = true) {
    const cacheKey = `${level}:${pretty ? "pretty" : "plain"}`;
    const cached = loggerCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const transport = pretty
        ? {
            target: "pino-pretty"
          }
        : undefined;

    const logger = pino({
        level,
        transport,
        base: undefined,
        timestamp: false
    });

    loggerCache.set(cacheKey, logger);
    return logger;
}

export const logger = createLogger();