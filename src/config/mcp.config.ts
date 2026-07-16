import { ConfigurationError } from "./validation.js";

export function buildMcpConfig(env: Record<string, string | undefined>) {
    return {
        host: normalizeHost(env.MCP_HOST),
        port: parsePort(env.MCP_PORT, 3001)
    };
}

function normalizeHost(value: string | undefined): string {
    if (value === undefined) {
        return "127.0.0.1";
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        throw new ConfigurationError("MCP_HOST must not be empty.");
    }

    return trimmedValue;
}

function parsePort(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
        throw new ConfigurationError("MCP_PORT must be between 1 and 65535.");
    }

    return parsed;
}
