import { describe, expect, it } from "vitest";
import { ConfigurationError, loadConfiguration, validateConfiguration } from "./index.js";

describe("configuration loading", () => {
    it("loads defaults when no environment variables are supplied", () => {
        const config = loadConfiguration({ env: {} });

        expect(config.app.name).toBe("QaBrainMCP");
        expect(config.browser.headless).toBe(true);
        expect(config.logger.level).toBe("info");
        expect(config.mcp.host).toBe("127.0.0.1");
        expect(config.mcp.port).toBe(3001);
    });

    it("validates invalid values", () => {
        expect(() =>
            validateConfiguration(
                loadConfiguration({
                    env: {
                        APP_NAME: "QaBrainMCP",
                        APP_VERSION: "1.0.0",
                        LOG_LEVEL: "verbose",
                        BROWSER: "edge",
                        HEADLESS: "not-a-bool",
                        MCP_PORT: "abc",
                        ENABLE_DEBUG: "yes"
                    }
                })
            )
        ).toThrow(ConfigurationError);
    });

    it("accepts a valid environment override", () => {
        const config = loadConfiguration({
            env: {
                APP_NAME: "ProdApp",
                APP_VERSION: "2.0.0",
                NODE_ENV: "production",
                LOG_LEVEL: "debug",
                BROWSER: "firefox",
                HEADLESS: "false",
                MCP_PORT: "4000",
                MCP_HOST: "0.0.0.0",
                ENABLE_DEBUG: "true"
            }
        });

        expect(config.app.name).toBe("ProdApp");
        expect(config.browser.browser).toBe("firefox");
        expect(config.logger.level).toBe("debug");
        expect(config.mcp.port).toBe(4000);
        expect(config.features.enableDebug).toBe(true);
    });
});
