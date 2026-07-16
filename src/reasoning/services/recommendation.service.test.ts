import { describe, expect, it } from "vitest";
import { RecommendationService } from "./recommendation.service.js";

describe("RecommendationService", () => {
    it("returns unique recommendation messages", () => {
        const recommendations = new RecommendationService().build([
            { type: "WORKFLOW", message: "Login workflow is missing" },
            { type: "WORKFLOW", message: "Login workflow is missing" },
            { type: "VALIDATION", message: "Password validation is uncovered" }
        ]);

        expect(recommendations).toEqual([
            "Login workflow is missing",
            "Password validation is uncovered"
        ]);
    });
});
