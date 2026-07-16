import { KnowledgeGraph } from "../models/graph.model.js";

export class GraphRepository {
    private graph: KnowledgeGraph = { nodes: [], edges: [], builtAt: new Date(0) };

    save(graph: KnowledgeGraph): KnowledgeGraph {
        this.graph = graph;
        return graph;
    }

    get(): KnowledgeGraph {
        return {
            nodes: [...this.graph.nodes],
            edges: [...this.graph.edges],
            builtAt: this.graph.builtAt
        };
    }

    clear(): void {
        this.graph = { nodes: [], edges: [], builtAt: new Date(0) };
    }
}

export const graphRepository = new GraphRepository();
