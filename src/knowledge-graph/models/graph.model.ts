import { GraphEdge } from "./graph-edge.model.js";
import { GraphNode } from "./graph-node.model.js";

export interface KnowledgeGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    builtAt: Date;
}

export interface GraphQueryResult {
    node: string;
    relatedPages: string[];
    components: string[];
    locators: string[];
    requirements: string[];
    workflows: string[];
    coverage: string[];
    impact: string[];
}
