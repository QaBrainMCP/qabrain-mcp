import { logger } from "./utils/logger.js";
import { startServer } from "./mcp/server.js";

async function main() {

    logger.info("🚀 QaBrainMCP Starting...");

    await startServer();

}

main().catch((error) => {
    logger.error(error);
});