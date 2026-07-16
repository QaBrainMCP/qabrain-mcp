import { loadConfiguration } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";
import { startServer } from "../../mcp/server.js";

export async function startCommand(): Promise<void> {
    const config = loadConfiguration();

    const logger = createLogger(
        config.logger.level,
        config.logger.pretty
    );

    logger.info("🚀 Starting QaBrainMCP...");

    await startServer(config);
}