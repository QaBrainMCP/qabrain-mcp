import { CoverageScores } from "../../coverage/models/coverage.model.js";

export class ConfidenceService {
    calculate(coverage: CoverageScores, findingCount: number, hasImpactEvidence: boolean): number {
        const averageCoverage = (coverage.pages + coverage.workflow + coverage.locators + coverage.components) / 4;
        const impactEvidence = hasImpactEvidence ? 5 : 0;
        const findingAdjustment = Math.min(10, findingCount * 2);
        return Math.max(0, Math.min(100, Math.round((averageCoverage * 0.85) + impactEvidence + findingAdjustment)));
    }
}

export const confidenceService = new ConfidenceService();
