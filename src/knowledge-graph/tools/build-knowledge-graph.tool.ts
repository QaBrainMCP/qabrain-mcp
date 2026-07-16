import { graphBuilderService } from "../services/graph-builder.service.js";

export async function buildKnowledgeGraph() {
    return graphBuilderService.build();
}
