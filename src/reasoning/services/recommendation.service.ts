import { Recommendation } from "../models/recommendation.model.js";

export class RecommendationService {
    build(findings: readonly Recommendation[]): string[] {
        return findings.filter((finding, index) =>
            findings.findIndex(item => item.message === finding.message) === index
        ).map(finding => finding.message);
    }
}

export const recommendationService = new RecommendationService();
