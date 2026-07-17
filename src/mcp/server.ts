import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerTools } from "./tools.js";
import { toolRegistry } from "./registry/tool.registry.js";

import type { MCPTool } from "./registry/tool.registry.js";
import { coreTools } from "../plugins/core/tools.js";
import { azureTools } from "../plugins/azure-devops/mcp/azure.tools.js";

import { createLogger } from "../utils/logger.js";
import type { RuntimeConfig } from "../config/environment.js";

export class QaBrainServer {
    private readonly logger;
    private server: Server | null = null;

    constructor(private readonly config: RuntimeConfig) {
        this.logger = createLogger(
            config.logger.level,
            config.logger.pretty
        );
    }

    public async start(): Promise<Server> {
        this.logger.info(
            {
                application: this.config.app.name,
                version: this.config.app.version
            },
            "Starting QaBrain MCP Server..."
        );

        this.server = new Server(
            {
                name: this.config.app.name,
                version: this.config.app.version
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        await this.registerAllTools();

        registerTools(this.server);

        const transport = new StdioServerTransport();

        await this.server.connect(transport);

        this.logger.info(
            {
                application: this.config.app.name,
                version: this.config.app.version,
                toolCount: toolRegistry.getAll().length
            },
            "✅ QaBrain MCP Server Started"
        );

        return this.server;
    }

    public async stop(): Promise<void> {
        this.logger.info("Stopping QaBrain MCP Server...");

        try {
            if (this.server) {
                // Reserved for future SDK disconnect/close support.
                this.server = null;
            }

            this.logger.info("✅ QaBrain MCP Server Stopped");
        } catch (error) {
            this.logger.error(error, "Error while stopping MCP Server");
        }
    }

    private async registerAllTools(): Promise<void> {
        this.logger.info("Registering MCP Tools...");

        this.registerPlugin("Core", coreTools);

        this.registerPlugin("Azure DevOps", azureTools);

        this.logger.info(
            {
                tools: toolRegistry.getAll().length
            },
            "Tool registration completed"
        );
    }

 private registerPlugin(
    plugin: string,
    tools: readonly MCPTool[]
): void {
    this.logger.info(
        {
            plugin,
            tools: tools.length
        },
        "Loading plugin"
    );

    for (const tool of tools) {
        toolRegistry.register(tool);

        this.logger.debug(
            {
                plugin,
                tool: tool.name
            },
            "Registered Tool"
        );
    }
}
}

export async function startServer(
    config: RuntimeConfig
): Promise<Server> {
    const server = new QaBrainServer(config);
    return server.start();
}