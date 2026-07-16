import { describe, expect, it } from "vitest";
import { ConfidenceService } from "./confidence.service.js";

describe("ConfidenceService", () => {
    it("combines coverage, findings, and impact evidence", () => {
        const confidence = new ConfidenceService().calculate(
            { pages: 100, workflow: 100, locators: 100, components: 100 },
            2,
            true
        );

        expect(confidence).toBe(94);
    });
});
