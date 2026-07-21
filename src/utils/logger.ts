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

    const isMcp = (process.env.MCP_MODE ?? "false").toLowerCase() === "true";

    let logger: Logger;
    if (isMcp) {
        // When running as an MCP server, ensure logs are emitted to stderr to avoid
        // contaminating the MCP JSON-RPC stream on stdout.
        const dest = pino.destination({ dest: 2 });
        logger = pino({ level, transport, base: undefined, timestamp: false } as any, dest);
    } else {
        logger = pino({ level, transport, base: undefined, timestamp: false } as any);
    }

    loggerCache.set(cacheKey, logger);
    return logger;
}

export const logger = createLogger();