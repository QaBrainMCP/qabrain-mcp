import { loadConfiguration } from "../../config/index.js";

export async function doctorCommand(): Promise<void> {
    try {
        const config = loadConfiguration();

        console.log("✅ QaBrain Doctor");
        console.log("------------------------");
        console.log(`Application : ${config.app.name}`);
        console.log(`Version     : ${config.app.version}`);
        console.log(`Environment : ${config.app.nodeEnv}`);
        console.log(`Browser     : ${config.browser.browser}`);
        console.log(`Headless    : ${config.browser.headless}`);
        console.log(`MCP         : ${config.mcp.host}:${config.mcp.port}`);
        console.log("\n✅ Configuration is valid.");
    } catch (error) {
        console.error("❌ Configuration validation failed.");
        throw error;
    }
}