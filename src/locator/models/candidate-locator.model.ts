export type LocatorStrategyType =
    | "data-testid"
    | "data-test"
    | "data-qa"
    | "id"
    | "name"
    | "aria-label"
    | "role"
    | "placeholder"
    | "label-association"
    | "title"
    | "alt"
    | "href"
    | "visible-text"
    | "css"
    | "xpath";

export interface LocatorCandidate {
    strategy: LocatorStrategyType;
    value: string;
    matchedCount: number;
    isUnique: boolean;
    isValid: boolean;
    automationRisk: "low" | "medium" | "high";
    selfHealingCandidate: boolean;
    confidence: number;
    stability: number;
    uniqueness: number;
    readability: number;
    maintainability: number;
    readable: number;
    generatedBy: string;
    scoreBreakdown: {
        uniquenessScore: number;
        stabilityScore: number;
        readabilityScore: number;
        maintainabilityScore: number;
        frameworkCompatibilityScore: number;
    };
    failureReasons: string[];
    recommendations: string[];
    explanation: string;
}
