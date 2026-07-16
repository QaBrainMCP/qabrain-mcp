import dotenv from "dotenv";

dotenv.config();

export type NodeEnv = "development" | "test" | "production";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type BrowserType = "chromium" | "firefox" | "webkit";

export interface RuntimeConfig {
    app: {
        name: string;
        version: string;
        nodeEnv: NodeEnv;
        application: {
            url: string;
            username: string;
            password: string;
        };
    };

    browser: {
        browser: BrowserType;
        headless: boolean;
    };

    logger: {
        level: LogLevel;
        pretty: boolean;
    };

    mcp: {
        host: string;
        port: number;
    };

    features: {
        enableDebug: boolean;
    };
}

export interface EnvironmentOverrides {
    env?: Record<string, string | undefined>;
}

export function loadEnvironment(
    overrides: EnvironmentOverrides = {}
): Record<string, string | undefined> {
    return {
        ...process.env,
        ...(overrides.env ?? {})
    };
}