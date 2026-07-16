import { KnowledgeGraph } from "../models/graph.model.js";
import { GraphNode } from "../models/graph-node.model.js";

export class GraphSearchService {
    find(graph: KnowledgeGraph, term: string): GraphNode[] {
        const normalized = term.toLowerCase();
        return graph.nodes.filter(node => node.label.toLowerCase().includes(normalized));
    }
}

export const graphSearchService = new GraphSearchService();
