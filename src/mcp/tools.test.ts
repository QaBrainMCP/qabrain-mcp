import { describe, expect, it } from "vitest";
import { registerTools } from "./tools.js";
import { toolRegistry } from "./registry/tool.registry.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

class MockServer {
    private handlers = new Map<string, unknown>();

    setRequestHandler(schema: unknown, handler: unknown) {
        this.handlers.set(String(schema), handler as never);
    }

    async invoke(schemaName: string, payload: unknown) {
        const handler = this.handlers.get(schemaName);
        if (typeof handler !== "function") {
            throw new Error(`No handler for ${schemaName}`);
        }
        return handler(payload);
    }
}

describe("MCP tool handlers", () => {
    it("registers tools and rejects unsupported tool names", async () => {
        const server = new MockServer();
        toolRegistry.register({
            name: "map_requirement",
            description: "Map requirement",
            execute: async () => ({ ok: true })
        });

        registerTools(server as never);

        await expect(server.invoke(String(CallToolRequestSchema), { params: { name: "unknown", arguments: {} } })).rejects.toThrow("Unsupported MCP tool: unknown");
    });
});
