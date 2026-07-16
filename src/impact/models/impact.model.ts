export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ImpactReport {
    changed: string;
    affectedPages: string[];
    affectedRequirements: string[];
    affectedWorkflows: string[];
    affectedComponents: string[];
    risk: RiskLevel;
    recommendedActions: string[];
    confidence: number;
}
