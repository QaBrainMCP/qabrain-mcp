import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";

export interface SearchComponentsInput { query: string; type?: string; pageId?: string }

export const SearchComponentsTool: MCPTool<SearchComponentsInput> = {
    name: "search_components",
    description: "Search components by name, type, or page",
    async execute(args: SearchComponentsInput) {
        const start = Date.now();
        logger.info({ tool: "search_components" }, "MCP Tool search_components started");
        let results = knowledgeStoreService.searchComponents(args.query || "");
        if (args.type) results = results.filter(r => (r.componentType ?? "").toLowerCase() === args.type!.toLowerCase());
        if (args.pageId) results = results.filter(r => r.pageId === args.pageId);
        const data = results.map(r => ({ componentId: r.componentId, businessName: r.businessName, pageId: r.pageId, componentType: r.componentType, confidence: r.confidence }));
        const res = { status: "ok", message: `Found ${data.length} components`, data, metadata: { count: data.length }, executionTime: Date.now() - start };
        logger.info({ tool: "search_components", executionTime: res.executionTime }, "MCP Tool search_components completed");
        return res;
    }
};
