import { describe, expect, it } from "vitest";
import { CoverageImpactService } from "./coverage-impact.service.js";

describe("CoverageImpactService", () => {
    it("calculates critical risk for poorly covered, highly connected changes", () => {
        const risk = new CoverageImpactService().calculateRisk(1, 2, 2, 40);

        expect(risk).toBe("CRITICAL");
    });
});
