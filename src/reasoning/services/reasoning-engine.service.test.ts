import { describe, expect, it } from "vitest";
import { CoverageEngineService } from "../../coverage/services/coverage-engine.service.js";
import { ImpactRepository } from "../../impact/repository/impact.repository.js";
import { KnowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { RequirementMappingService } from "../../mapping/services/requirement-mapping.service.js";
import { WorkflowMemoryService } from "../../workflow/services/workflow.memory.service.js";
import { ReasoningRepository } from "../repository/reasoning.repository.js";
import { ReasoningEngineService } from "./reasoning-engine.service.js";

describe("ReasoningEngineService", () => {
    it("turns existing coverage knowledge into QA recommendations", () => {
        const engine = new ReasoningEngineService(
            new ReasoningRepository(),
            {
                analyze: () => ({
                    report: {
                        requirement: "Login", coverage: { pages: 100, workflow: 0, locators: 100, components: 100 },
                        gaps: ["Login workflow missing"], confidence: 75
                    },
                    details: [{ type: "WORKFLOW", message: "Login workflow missing" }]
                })
            } as unknown as CoverageEngineService,
            {
                map: () => ({
                    application: "Playwright", pages: ["Login"], elements: [], workflow: null,
                    knownLocators: [], confidence: 50
                })
            } as unknown as RequirementMappingService,
            new KnowledgeRepository(),
            new ImpactRepository(),
            new WorkflowMemoryService()
        );

        const result = engine.reason("Scenario: Login");

        expect(result.recommendations).toContain("Login workflow is missing");
        expect(result.recommendations).toContain("Workflow coverage is low");
        expect(result.risk).toBe("HIGH");
    });
});
