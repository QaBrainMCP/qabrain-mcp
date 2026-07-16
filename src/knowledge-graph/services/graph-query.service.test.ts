import { describe, expect, it } from "vitest";
import { GraphRepository } from "../repository/graph.repository.js";
import { GraphQueryService } from "./graph-query.service.js";

describe("GraphQueryService", () => {
    it("returns connected QA knowledge for a page", () => {
        const repository = new GraphRepository();
        repository.save({
            nodes: [
                { id: "page-login", type: "Page", label: "Login" },
                { id: "component-username", type: "Component", label: "Username" },
                { id: "workflow-login", type: "Workflow", label: "Login Flow" },
                { id: "requirement-login", type: "Requirement", label: "User Login" },
                { id: "coverage-login", type: "Coverage", label: "Coverage: User Login" },
                { id: "impact-login", type: "Impact", label: "Impact: Login" }
            ],
            edges: [
                { id: "contains", sourceId: "page-login", targetId: "component-username", type: "CONTAINS" },
                { id: "uses", sourceId: "workflow-login", targetId: "page-login", type: "USES" },
                { id: "depends", sourceId: "requirement-login", targetId: "workflow-login", type: "IMPLEMENTS" },
                { id: "covers", sourceId: "coverage-login", targetId: "requirement-login", type: "COVERS" },
                { id: "affects", sourceId: "impact-login", targetId: "page-login", type: "AFFECTS" }
            ],
            builtAt: new Date()
        });

        const result = new GraphQueryService(repository).query("Show everything related to Login page.");

        expect(result.node).toBe("Login");
        expect(result.components).toEqual(["Username"]);
        expect(result.workflows).toEqual(["Login Flow"]);
        expect(result.requirements).toEqual(["User Login"]);
        expect(result.coverage).toEqual(["Coverage: User Login"]);
        expect(result.impact).toEqual(["Impact: Login"]);
    });
});
