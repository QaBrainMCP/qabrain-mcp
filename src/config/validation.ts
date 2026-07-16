import { buildAppConfig } from "./app.config.js";
import { buildBrowserConfig } from "./browser.config.js";
import { buildLoggerConfig } from "./logger.config.js";
import { buildMcpConfig } from "./mcp.config.js";
import {
    loadEnvironment,
    type EnvironmentOverrides,
    type RuntimeConfig
} from "./environment.js";

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigurationError";
    }
}

export function validateConfiguration(config: RuntimeConfig): RuntimeConfig {
    const errors: string[] = [];

    // Application
    if (!config.app.name?.trim()) {
        errors.push("APP_NAME is required.");
    }

    if (!config.app.version?.trim()) {
        errors.push("APP_VERSION is required.");
    }

    if (!config.app.application.url?.trim()) {
        errors.push("APP_URL is required.");
    }

    if (!config.app.application.username?.trim()) {
        errors.push("APP_USERNAME is required.");
    }

    if (!config.app.application.password?.trim()) {
        errors.push("APP_PASSWORD is required.");
    }

    // MCP
    if (!config.mcp.host?.trim()) {
        errors.push("MCP_HOST is required.");
    }

    if (config.mcp.port < 1 || config.mcp.port > 65535) {
        errors.push("MCP_PORT must be between 1 and 65535.");
    }

    // Logger
    if (!(["info", "warn", "error", "debug"] as const).includes(config.logger.level)) {
        errors.push("LOG_LEVEL must be one of: info, warn, error, debug.");
    }

    if (errors.length > 0) {
        throw new ConfigurationError(
            `Invalid configuration:\n- ${errors.join("\n- ")}`
        );
    }

    return config;
}

export function buildRuntimeConfig(
    env: Record<string, string | undefined>
): RuntimeConfig {
    return {
        app: buildAppConfig(env),
        browser: buildBrowserConfig(env),
        logger: buildLoggerConfig(env),
        mcp: buildMcpConfig(env),
        features: {
            enableDebug: parseBoolean(
                env.ENABLE_DEBUG,
                false,
                "ENABLE_DEBUG"
            )
        }
    };
}

export function loadConfiguration(
    options: EnvironmentOverrides = {}
): RuntimeConfig {
    const env = loadEnvironment(options);
    const config = buildRuntimeConfig(env);
    return validateConfiguration(config);
}

function parseBoolean(
    value: string | undefined,
    fallback: boolean,
    settingName: string
): boolean {
    if (value === undefined) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();

    if (["1", "true", "yes", "on"].includes(normalized)) {
        return true;
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
        return false;
    }

    throw new ConfigurationError(
        `${settingName} must be a boolean value.`
    );
}