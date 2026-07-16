import { graphQueryService } from "../services/graph-query.service.js";

export interface QueryKnowledgeGraphInput {
    query: string;
}

export async function queryKnowledgeGraph(input: QueryKnowledgeGraphInput) {
    return graphQueryService.query(input.query);
}
