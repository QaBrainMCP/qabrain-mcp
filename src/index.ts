import { loadConfiguration, ConfigurationError } from "./config/index.js";
import { createLogger } from "./utils/logger.js";
import { startServer } from "./mcp/server.js";
import { enableMcpMode } from "./utils/mcp-mode.js";

// Enable MCP mode early so that modules that run during startup do not
// emit to stdout and contaminate the MCP JSON transport.
enableMcpMode();

async function main() {
    const config = loadConfiguration();

    const logger = createLogger(
        config.logger.level,
        config.logger.pretty
    );

    logger.info(
        {
            app: config.app.name,
            version: config.app.version,
        },
        "🚀 QaBrainMCP Starting..."
    );

    await startServer(config);
}

main().catch((error) => {
    const message =
        error instanceof ConfigurationError
            ? error.message
            : error instanceof Error
                ? error.message
                : String(error);

    console.error(`Startup failed: ${message}`);
    process.exit(1);
});