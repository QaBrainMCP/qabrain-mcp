export interface StepAnalysis {
    businessIntent: string;
    actionType: string;
    targetComponent: string | null;
    expectedPage: string | null;
    expectedComponents: string[];
    optionalComponents: string[];
    ignoredComponents: string[];
    prerequisites: string[];
    confidence: number; // 0-100
    reasoning: string;
}

export default StepAnalysis;
