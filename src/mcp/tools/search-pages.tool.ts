import type { MCPTool } from "../registry/tool.registry.js";
import { pageSearchService } from "../../services/repository/page-search.service.js";
import { logger } from "../../utils/logger.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";

export interface SearchPagesRequest {
    query: string;
}

export const SearchPagesTool: MCPTool<SearchPagesRequest> = {
    name: "search_pages",
    description: "Search pages in repository with intelligent matching",
    async execute(input: SearchPagesRequest) {
        logger.info({ query: input.query }, "Search Started");
        await knowledgeStoreService.load();
        const matches = pageSearchService.search(input.query).map(m => ({
            pageName: m.page?.pageName ?? "",
            confidence: m.confidence,
            matchType: m.matchType
        }));
        logger.info({ query: input.query, matches: matches.length }, "Search Completed");
        return { matches };
    }
};
