import { ConfigurationError } from "./validation.js";
import type { BrowserType } from "./environment.js";

export function buildBrowserConfig(env: Record<string, string | undefined>) {
    return {
        browser: normalizeBrowserType(env.BROWSER),
        headless: parseBoolean(env.HEADLESS, true, "HEADLESS")
    };
}

function normalizeBrowserType(value: string | undefined): BrowserType {
    switch (value?.toLowerCase()) {
        case "firefox":
            return "firefox";
        case "webkit":
            return "webkit";
        case "chromium":
        case undefined:
            return "chromium";
        default:
            throw new ConfigurationError("BROWSER must be one of: chromium, firefox, webkit.");
    }
}

function parseBoolean(value: string | undefined, fallback: boolean, settingName: string): boolean {
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

    throw new ConfigurationError(`${settingName} must be a boolean value.`);
}
