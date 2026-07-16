import { buildKnowledgeGraph } from "../../knowledge-graph/tools/build-knowledge-graph.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const BuildKnowledgeGraphTool: MCPTool = {
    name: "build_knowledge_graph",
    description: "Build a knowledge-graph snapshot from all remembered QA intelligence.",
    async execute() {
        return buildKnowledgeGraph();
    }
};
