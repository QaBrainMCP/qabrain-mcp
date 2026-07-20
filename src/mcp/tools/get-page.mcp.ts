import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";

export interface GetPageInput { pageName: string }

export const GetPageTool: MCPTool<GetPageInput> = {
    name: "get_page",
    description: "Retrieve page metadata by name",
    async execute(args: GetPageInput) {
        const start = Date.now();
        logger.info({ tool: "get_page" }, "MCP Tool get_page started");
        const results = knowledgeStoreService.searchPages(args.pageName || "");
        const data = results.map(p => ({ pageId: p.pageId, pageName: p.pageName, urlPattern: p.urlPattern, title: p.title, navigationLinks: p.navigationLinks }));
        const res = {
            status: "ok",
            message: `Found ${data.length} pages`,
            data,
            metadata: { count: data.length },
            executionTime: Date.now() - start
        };
        logger.info({ tool: "get_page", executionTime: res.executionTime }, "MCP Tool get_page completed");
        return res;
    }
};
