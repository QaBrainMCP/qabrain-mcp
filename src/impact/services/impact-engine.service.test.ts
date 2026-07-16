import { describe, expect, it } from "vitest";
import { CoverageRepository } from "../../coverage/repository/coverage.repository.js";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { KnowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { ImpactRepository } from "../repository/impact.repository.js";
import { ImpactEngineService } from "./impact-engine.service.js";
import { PageImpactService } from "./page-impact.service.js";

describe("ImpactEngineService", () => {
    it("joins page, workflow, and requirement dependencies into an impact report", () => {
        const now = new Date();
        const knowledge = new KnowledgeRepository();
        const page: PageKnowledge = {
            id: "login", title: "Login", url: "/login",
            buttons: [{ type: "button", name: "Login", selector: "button" }], links: [],
            inputs: [{ type: "input", name: "Username", selector: "input" }], dropdowns: [], forms: [],
            tables: [], dialogs: [], navigationTargets: [], locators: ["Username"], visitedCount: 1,
            createdAt: now, updatedAt: now
        };
        knowledge.savePage(page);
        const coverage = new CoverageRepository();
        coverage.save({
            requirement: "User Login", coverage: { pages: 100, workflow: 100, locators: 80, components: 80 },
            gaps: [], confidence: 91
        }, { feature: "Scenario: User Login", pages: ["Login"], elements: ["Username", "Login Button"] });
        workflowMemory.clear();
        workflowMemory.remember({
            id: "login-flow", name: "Login Flow", application: "Playwright", pages: ["Login"],
            actions: ["Submit Login"], locators: ["Username"], createdAt: now
        });
        const engine = new ImpactEngineService(
            new ImpactRepository(), coverage, new PageImpactService(knowledge)
        );

        const report = engine.analyze("Login");

        expect(report.affectedPages).toEqual(["Login"]);
        expect(report.affectedRequirements).toEqual(["User Login"]);
        expect(report.affectedWorkflows).toEqual(["Login Flow"]);
        expect(report.affectedComponents).toEqual(["Login Button", "Username"]);
        expect(report.risk).toBe("MEDIUM");
        expect(report.recommendedActions).toEqual([
            "Review Login Requirement", "Verify Login Workflow", "Validate Login Components"
        ]);
    });
});
