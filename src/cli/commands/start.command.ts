import { loadConfiguration } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";
import { startServer } from "../../mcp/server.js";
import { browserManager } from "../../browser/browser.manager.js";

export async function startCommand(): Promise<void> {
    const config = loadConfiguration();

    const logger = createLogger(
        config.logger.level,
        config.logger.pretty
    );

    logger.info(
        {
            application: config.app.name,
            version: config.app.version,
            environment: config.app.nodeEnv
        },
        "🚀 Starting QaBrainMCP..."
    );

    try {
        await startServer(config);

        process.on("SIGINT", async () => {
            logger.info("Received SIGINT. Shutting down...");
            await browserManager.close();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            logger.info("Received SIGTERM. Shutting down...");
            await browserManager.close();
            process.exit(0);
        });

    } catch (error) {
        logger.error(error, "Failed to start QaBrainMCP");
        process.exit(1);
    }
}