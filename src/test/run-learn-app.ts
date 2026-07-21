import { toolRegistry } from "../mcp/registry/tool.registry.js";
import { coreTools } from "../plugins/core/tools.js";

async function registerTools() {
    for (const t of coreTools) {
        toolRegistry.register(t as any);
    }
}

async function run() {
    await registerTools();
    const tool = toolRegistry.get("learn_application");
    if (!tool) {
        console.error("learn_application tool not registered");
        process.exit(1);
    }

    try {
        const res = await tool.execute({ application: process.env.APP_NAME ?? "orangehrm" } as any);
        // write JSON report to stderr to avoid interfering with stdout
        console.error(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error("Error during learn_application:", err);
        process.exitCode = 1;
    }
}

void run();
