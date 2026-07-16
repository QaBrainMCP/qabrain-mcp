import { describe, expect, it } from "vitest";
import { QAReportService } from "./qa-report.service.js";

describe("QAReportService", () => {
    it("renders a readable QA analysis report", () => {
        const service = new QAReportService();

        const report = service.generate(`Feature: Login
Scenario: User logs in
Given User opens login page
When User enters username
Then User is authenticated`);

        expect(report).toContain("QA Requirement Analysis");
        expect(report).toContain("Scenario : User logs in");
        expect(report).toContain("Step     : Given User opens login page");
        expect(report).toContain("Entities : phrase(User)");
    });
});
