import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";

export interface GetComponentInput { componentName: string }

export const GetComponentTool: MCPTool<GetComponentInput> = {
    name: "get_component",
    description: "Retrieve component details by name",
    async execute(args: GetComponentInput) {
        const start = Date.now();
        logger.info({ tool: "get_component" }, "MCP Tool get_component started");
        const comps = knowledgeStoreService.searchComponents(args.componentName || "");
        if (comps.length === 0) return { status: "not_found", message: "Component not found", data: null, metadata: {}, executionTime: Date.now() - start };
        const c = comps[0];
        const locs = knowledgeStoreService.getLocatorsForComponent(c.componentId);
        const primary = locs.find(l => l.isPrimary) ?? null;
        const data = {
            businessName: c.businessName,
            pageId: c.pageId,
            componentType: c.componentType,
            confidence: c.confidence,
            automationName: c.automationName,
            primaryLocator: primary,
            alternativeLocators: locs.filter(l => !l.isPrimary),
            lastValidated: primary?.lastValidated ?? null
        };
        const res = { status: "ok", message: "Component retrieved", data, metadata: {}, executionTime: Date.now() - start };
        logger.info({ tool: "get_component", executionTime: res.executionTime }, "MCP Tool get_component completed");
        return res;
    }
};
