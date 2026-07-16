import { describe, expect, it } from "vitest";
import { GraphRepository } from "./graph.repository.js";

describe("GraphRepository", () => {
    it("stores a graph snapshot", () => {
        const repository = new GraphRepository();
        const graph = { nodes: [{ id: "page-login", type: "Page" as const, label: "Login" }], edges: [], builtAt: new Date() };

        repository.save(graph);

        expect(repository.get().nodes).toEqual(graph.nodes);
    });
});
