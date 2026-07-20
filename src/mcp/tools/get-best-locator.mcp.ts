import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";

export interface GetBestLocatorInput { componentName: string }

export const GetBestLocatorTool: MCPTool<GetBestLocatorInput> = {
    name: "get_best_locator",
    description: "Return primary validated locator for a component",
    async execute(args: GetBestLocatorInput) {
        const start = Date.now();
        logger.info({ tool: "get_best_locator" }, "MCP Tool get_best_locator started");
        const comps = knowledgeStoreService.searchComponents(args.componentName || "");
        if (comps.length === 0) return { status: "not_found", message: "Component not found", data: null, metadata: {}, executionTime: Date.now() - start };
        const c = comps[0];
        const locs = knowledgeStoreService.getLocatorsForComponent(c.componentId).filter(l => l.validationStatus === "VALIDATED");
        const primary = locs.find(l => l.isPrimary) ?? locs[0] ?? null;
        const data = primary ? { strategy: primary.strategy, locator: primary.locator, confidence: primary.confidence, lastValidated: primary.lastValidated } : null;
        const res = { status: primary ? "ok" : "not_found", message: primary ? "Primary locator found" : "No validated locator", data, metadata: {}, executionTime: Date.now() - start };
        logger.info({ tool: "get_best_locator", executionTime: res.executionTime }, "MCP Tool get_best_locator completed");
        return res;
    }
};
