import { describe, expect, it } from "vitest";
import { RuleEngineService } from "./rule-engine.service.js";

describe("RuleEngineService", () => {
    it("infers validation, workflow, navigation, and low-coverage recommendations", () => {
        const findings = new RuleEngineService().infer({
            mapping: {
                application: "Playwright", pages: ["Login", "Dashboard"], elements: [],
                workflow: null, knownLocators: [], confidence: 50
            },
            coverage: {
                report: {
                    requirement: "Login", coverage: { pages: 100, workflow: 0, locators: 100, components: 100 },
                    gaps: [], confidence: 75
                },
                details: [
                    { type: "WORKFLOW", message: "Login workflow missing" },
                    { type: "VALIDATION", message: "Password validation missing" }
                ]
            },
            pages: [], relationships: [], workflows: [], impacts: []
        });

        expect(findings.map(finding => finding.message)).toContain("Login workflow is missing");
        expect(findings.map(finding => finding.message)).toContain("Password validation is uncovered");
        expect(findings.map(finding => finding.message)).toContain("Workflow coverage is low");
        expect(findings.map(finding => finding.message)).toContain(
            "Navigation between Login and Dashboard is not learned"
        );
    });
});
