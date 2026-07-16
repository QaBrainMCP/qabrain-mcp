import { CoverageRecord } from "../../coverage/repository/coverage.repository.js";
import { RiskLevel } from "../models/impact.model.js";

export class CoverageImpactService {
    coverageScore(records: readonly CoverageRecord[]): number {
        if (records.length === 0) {
            return 0;
        }
        const scores = records.map(record => {
            const coverage = record.report.coverage;
            return (coverage.pages + coverage.workflow + coverage.locators + coverage.components) / 4;
        });
        return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
    }

    calculateRisk(pageCount: number, workflowCount: number, requirementCount: number, coverageScore: number): RiskLevel {
        if (coverageScore < 50 && (workflowCount >= 2 || requirementCount >= 2)) {
            return "CRITICAL";
        }
        if (workflowCount >= 2 || requirementCount >= 2 || coverageScore < 75) {
            return "HIGH";
        }
        if (pageCount > 1 || workflowCount > 0 || requirementCount > 0 || coverageScore < 90) {
            return "MEDIUM";
        }
        return "LOW";
    }
}
