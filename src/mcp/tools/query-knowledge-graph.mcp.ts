import {
    QueryKnowledgeGraphInput,
    queryKnowledgeGraph
} from "../../knowledge-graph/tools/query-knowledge-graph.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const QueryKnowledgeGraphTool: MCPTool<QueryKnowledgeGraphInput> = {
    name: "query_knowledge_graph",
    description: "Query connected QA knowledge from the built knowledge graph.",
    async execute(args: QueryKnowledgeGraphInput) {
        return queryKnowledgeGraph(args);
    }
};
