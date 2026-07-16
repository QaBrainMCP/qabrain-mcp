import { loadConfiguration, ConfigurationError } from "./config/index.js";
import { createLogger } from "./utils/logger.js";
import { startServer } from "./mcp/server.js";

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