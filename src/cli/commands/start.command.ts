import { loadConfiguration } from "../../config/index.js";
import { createLogger } from "../../utils/logger.js";
import { startServer } from "../../mcp/server.js";
import { browserManager } from "../../browser/browser.manager.js";
import { enableMcpMode } from "../../utils/mcp-mode.js";

// enable MCP mode for CLI start path as well (in case server is launched in MCP mode)
enableMcpMode();

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
        const server = await startServer(config);

        process.on("SIGINT", async () => {
            logger.info("Received SIGINT. Shutting down...");
            try {
                if (server && typeof (server as any).disconnect === "function") {
                    await (server as any).disconnect();
                }
            } finally {
                await browserManager.close();
                process.exit(0);
            }
        });

        process.on("SIGTERM", async () => {
            logger.info("Received SIGTERM. Shutting down...");
            try {
                if (server && typeof (server as any).disconnect === "function") {
                    await (server as any).disconnect();
                }
            } finally {
                await browserManager.close();
                process.exit(0);
            }
        });

    } catch (error) {
        logger.error(error, "Failed to start QaBrainMCP");
        process.exit(1);
    }
}