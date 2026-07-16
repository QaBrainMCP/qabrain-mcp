import { RiskLevel } from "../../impact/models/impact.model.js";

export interface ReasoningResult {
    recommendations: string[];
    risk: RiskLevel;
    confidence: number;
}
