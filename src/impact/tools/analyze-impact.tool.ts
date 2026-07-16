import { impactEngineService } from "../services/impact-engine.service.js";

export interface AnalyzeImpactInput {
    page: string;
}

export async function analyzeImpact(input: AnalyzeImpactInput) {
    return impactEngineService.analyze(input.page);
}
