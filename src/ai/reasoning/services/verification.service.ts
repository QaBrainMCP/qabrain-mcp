import { Page } from "playwright";

import { AIDecision } from "../models/ai-decision.js";
import { VerificationResult } from "../models/reasoning-result.js";

export class VerificationService {
    async verify(page: Page, decision: AIDecision): Promise<VerificationResult> {
        const expectedPage = decision.expectedPage;
        const expectedHeading = decision.expectedPage;
        const expectedComponent = decision.targetComponent;
        const expectedUrl = decision.expectedPage
            ? decision.expectedPage.toLowerCase().replace(/\s+/g, "")
            : null;

        const currentUrl = page.url().toLowerCase();
        const urlMatches = expectedUrl ? currentUrl.includes(expectedUrl) : false;

        const headingMatches = expectedHeading
            ? await page.getByRole("heading", { name: new RegExp(this.escapeRegex(expectedHeading), "i") }).count().then(count => count > 0).catch(() => false)
            : false;

        const componentMatches = expectedComponent
            ? await page.getByText(new RegExp(this.escapeRegex(expectedComponent), "i")).count().then(count => count > 0).catch(() => false)
            : false;

        const pass = urlMatches || headingMatches || componentMatches;

        return {
            status: pass ? "PASS" : "FAIL",
            reason: pass
                ? "Expected page state observed"
                : "Expected page, heading, component, or URL was not observed",
            expectedPage,
            expectedHeading,
            expectedComponent,
            expectedUrl
        };
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}

export const verificationService = new VerificationService();
