export type RelationshipType = "NAVIGATION";

export interface Relationship {
    id: string;
    sourcePageId: string;
    targetPageId: string;
    type: RelationshipType;
    createdAt: Date;
}
