import { describe, expect, it } from "vitest";
import { applicationMapService } from "../../application/services/application-map.service.js";
import { coverageRepository } from "../../coverage/repository/coverage.repository.js";
import { impactRepository } from "../../impact/repository/impact.repository.js";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { mappingRepository } from "../../mapping/repository/mapping.repository.js";
import { reasoningRepository } from "../../reasoning/repository/reasoning.repository.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { GraphRepository } from "../repository/graph.repository.js";
import { GraphBuilderService } from "./graph-builder.service.js";

describe("GraphBuilderService", () => {
    it("builds nodes and relationships from remembered QA knowledge", () => {
        const now = new Date();
        const page: PageKnowledge = {
            id: "login", title: "Login", url: "/login",
            buttons: [{ type: "button", name: "Login", selector: "button" }], links: [],
            inputs: [{ type: "input", name: "Username", selector: "input" }], dropdowns: [], forms: [],
            tables: [], dialogs: [], navigationTargets: [], locators: ["Username"], visitedCount: 1,
            createdAt: now, updatedAt: now
        };
        applicationMapService.create("Playwright");
        applicationMapService.addPage({ id: "login", title: "Login", url: "/login" });
        knowledgeRepository.clear();
        knowledgeRepository.savePage(page);
        workflowMemory.clear();
        workflowMemory.remember({
            id: "login-flow", name: "Login Flow", application: "Playwright", pages: ["Login"],
            actions: ["Open Login"], locators: ["Username"], createdAt: now
        });
        coverageRepository.clear();
        coverageRepository.save({
            requirement: "User Login", coverage: { pages: 100, workflow: 100, locators: 100, components: 100 },
            gaps: [], confidence: 100
        }, { feature: "Scenario: User Login", pages: ["Login"], elements: ["Username"] });
        impactRepository.clear();
        reasoningRepository.clear();
        mappingRepository.clear();

        const graph = new GraphBuilderService(new GraphRepository()).build();

        expect(graph.nodes.map(node => node.type)).toContain("Application");
        expect(graph.nodes.map(node => node.type)).toContain("Requirement");
        expect(graph.nodes.map(node => node.type)).toContain("Component");
        expect(graph.edges.some(edge => edge.type === "CONTAINS")).toBe(true);
        expect(graph.edges.some(edge => edge.type === "COVERS")).toBe(true);
        expect(graph.edges.some(edge => edge.type === "USES")).toBe(true);
    });
});
