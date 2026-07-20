import { StepLearningResult } from "./step-learning-result.model.js";

export interface ExecutionResult {
    feature: string;
    scenario: string;
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    learnedPages: number;
    learnedComponents: number;
    validatedLocators: number;
    aiCalls: number;
    knowledgeOnlyExecutions: number;
    executionDuration: number;
    stepResults: StepLearningResult[];
}
