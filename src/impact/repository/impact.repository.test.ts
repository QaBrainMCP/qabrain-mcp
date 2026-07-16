import { describe, expect, it } from "vitest";
import { ImpactRepository } from "./impact.repository.js";

describe("ImpactRepository", () => {
    it("stores impact reports", () => {
        const repository = new ImpactRepository();
        const report = {
            changed: "Login", affectedPages: ["Login"], affectedRequirements: [], affectedWorkflows: [],
            affectedComponents: [], risk: "LOW" as const, recommendedActions: [], confidence: 80
        };

        repository.save(report);

        expect(repository.getAll()).toEqual([report]);
    });
});
