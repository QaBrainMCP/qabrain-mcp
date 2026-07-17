import { ConfigurationError } from "./validation.js";
import type { NodeEnv } from "./environment.js";

export function buildAppConfig(env: Record<string, string | undefined>) {
    return {
        // QaBrain application metadata
        name: normalizeRequiredString(
            env.APP_NAME,
            "APP_NAME",
            "QaBrainMCP"
        ),
        version: normalizeRequiredString(
            env.APP_VERSION,
            "APP_VERSION",
            "1.0.1"
        ),
        nodeEnv: normalizeNodeEnv(env.NODE_ENV),

        // Target application under test
        application: {
            name: normalizeRequiredString(
                env.TARGET_APP_NAME,
                "TARGET_APP_NAME",
                "Application"
            ),
            url: normalizeRequiredString(
                env.APP_URL,
                "APP_URL",
                ""
            ),
            username: normalizeRequiredString(
                env.APP_USERNAME,
                "APP_USERNAME",
                ""
            ),
            password: normalizeRequiredString(
                env.APP_PASSWORD,
                "APP_PASSWORD",
                ""
            )
        }
    };
}

function normalizeRequiredString(
    value: string | undefined,
    name: string,
    fallback: string
): string {
    if (value === undefined) {
        return fallback;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
        throw new ConfigurationError(`${name} must not be empty.`);
    }

    return trimmedValue;
}

function normalizeNodeEnv(value: string | undefined): NodeEnv {
    switch (value?.toLowerCase()) {
        case "production":
            return "production";
        case "test":
            return "test";
        case "development":
        case undefined:
            return "development";
        default:
            throw new ConfigurationError(
                "NODE_ENV must be one of: development, test, production."
            );
    }
}