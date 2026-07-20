import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";

export const GetNavigationTool: MCPTool = {
    name: "get_navigation",
    description: "Return navigation graph",
    async execute() {
        const start = Date.now();
        logger.info({ tool: "get_navigation" }, "MCP Tool get_navigation started");
        const nav = knowledgeStoreService.getNavigation();
        const res = { status: "ok", message: "Navigation graph retrieved", data: nav, metadata: { count: nav.length }, executionTime: Date.now() - start };
        logger.info({ tool: "get_navigation", executionTime: res.executionTime }, "MCP Tool get_navigation completed");
        return res;
    }
};
