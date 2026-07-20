export interface ExecutionStepResult {
    stepNumber: number;
    featureStep: string;
    businessIntent: string | null;
    actionType: string | null;
    pageState: any;
    discoveryProfile: string | null;
    expectedComponents: string[];
    discoveredComponents: string[]; // names
    validatedComponents: string[]; // names
    missingComponents: string[]; // names
    generatedLocators: string[];
    knowledgeUpdates: { newComponents: number; updatedComponents: number };
    executionStatus: "SUCCESS" | "FAILED" | "SKIPPED";
    confidence: number;
    executionTime: number;
    discoveryFallback?: { occurred: boolean; reason?: string };
}

export default ExecutionStepResult;
