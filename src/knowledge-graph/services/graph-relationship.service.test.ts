import { describe, expect, it } from "vitest";
import { GraphRelationshipService } from "./graph-relationship.service.js";

describe("GraphRelationshipService", () => {
    it("creates unique graph relationships", () => {
        const relationships = new GraphRelationshipService();
        const edges: { id: string; sourceId: string; targetId: string; type: "CONTAINS" }[] = [];

        relationships.connect(edges, "application", "login", "CONTAINS");
        relationships.connect(edges, "application", "login", "CONTAINS");

        expect(edges).toHaveLength(1);
        expect(relationships.relatedIds(edges, "application")).toEqual(["login"]);
    });
});
