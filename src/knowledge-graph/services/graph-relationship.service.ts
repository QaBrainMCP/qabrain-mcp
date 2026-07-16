import { GraphEdge, GraphEdgeType } from "../models/graph-edge.model.js";

export class GraphRelationshipService {
    connect(edges: GraphEdge[], sourceId: string, targetId: string, type: GraphEdgeType): void {
        if (sourceId === targetId || edges.some(edge =>
            edge.sourceId === sourceId && edge.targetId === targetId && edge.type === type
        )) {
            return;
        }
        edges.push({ id: `${type}:${sourceId}:${targetId}`, sourceId, targetId, type });
    }

    relatedIds(edges: readonly GraphEdge[], nodeId: string): string[] {
        return edges.flatMap(edge => {
            if (edge.sourceId === nodeId) return [edge.targetId];
            if (edge.targetId === nodeId) return [edge.sourceId];
            return [];
        });
    }
}

export const graphRelationshipService = new GraphRelationshipService();
