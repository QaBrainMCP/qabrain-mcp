import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";

export interface GetPageModelInput { pageName: string }

export const GetPageModelTool: MCPTool<GetPageModelInput> = {
    name: "get_page_model",
    description: "Retrieve page model: components and primary locators",
    async execute(args: GetPageModelInput) {
        const start = Date.now();
        logger.info({ tool: "get_page_model" }, "MCP Tool get_page_model started");
        const pages = knowledgeStoreService.searchPages(args.pageName || "");
        if (pages.length === 0) return { status: "not_found", message: "Page not found", data: null, metadata: {}, executionTime: Date.now() - start };
        const page = pages[0];
        // gather components
        const components = (Object.values((knowledgeStoreService as any).components) as any[]).filter(c => c.pageId === page.pageId);
        const primaryLocators = components.map(c => ({ componentId: c.componentId, primary: (Object.values((knowledgeStoreService as any).locators) as any[]).filter(l => l.componentId === c.componentId && l.isPrimary) }));
        const navigation = knowledgeStoreService.getNavigation().filter(n => n.fromPage === page.pageId || n.fromPage === page.urlPattern || n.toPage === page.pageId || n.toPage === page.urlPattern);

        const data = {
            page,
            components,
            primaryLocators,
            navigation,
            forms: components.filter(c => c.componentType === "form"),
            tables: components.filter(c => c.componentType === "table"),
            buttons: components.filter(c => c.componentType === "button"),
            inputs: components.filter(c => c.componentType === "input")
        };

        const res = { status: "ok", message: "Page model retrieved", data, metadata: { components: components.length }, executionTime: Date.now() - start };
        logger.info({ tool: "get_page_model", executionTime: res.executionTime }, "MCP Tool get_page_model completed");
        return res;
    }
};
