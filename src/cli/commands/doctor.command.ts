import { loadConfiguration } from "../../config/index.js";

export async function doctorCommand(): Promise<void> {
    console.log("🔍 QaBrain Doctor");
    console.log("------------------------");

    try {
        const config = loadConfiguration();

        console.log(`Application : ${config.app.name}`);
        console.log(`Version     : ${config.app.version}`);
        console.log(`Environment : ${config.app.nodeEnv}`);
        console.log(`Browser     : ${config.browser.browser}`);
        console.log(`Headless    : ${config.browser.headless}`);
        console.log(`MCP         : ${config.mcp.host}:${config.mcp.port}`);

        console.log("\n✅ Configuration is valid.");
    } catch (error) {
        console.log("❌ Configuration is invalid.\n");

        if (error instanceof Error) {
            console.log(error.message);
        } else {
            console.log(String(error));
        }

        console.log("\n💡 Fix your .env file and run:");
        console.log("   qabrain-mcp doctor");

        process.exitCode = 1;
    }
}