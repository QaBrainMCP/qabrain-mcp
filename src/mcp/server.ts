import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { toolRegistry } from "./registry/tool.registry.js";
import { RememberPageTool } from "./tools/remember-page.mcp.js";
import { logger } from "../utils/logger.js";

export async function startServer() {

    const server = new Server(
        {
            name: "QaBrain MCP",
            version: "0.1.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    registerTools(server);

    // Register custom MCP tools
    toolRegistry.register(RememberPageTool);
    logger.info("Remember Page Tool Registered");

    const transport = new StdioServerTransport();

    await server.connect(transport);

    logger.info("✅ MCP Connected");
}