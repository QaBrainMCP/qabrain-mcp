export type GraphEdgeType =
    | "CONTAINS"
    | "IMPLEMENTS"
    | "USES"
    | "NAVIGATES_TO"
    | "COVERS"
    | "AFFECTS"
    | "DEPENDS_ON"
    | "RECOMMENDS";

export interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    type: GraphEdgeType;
}
