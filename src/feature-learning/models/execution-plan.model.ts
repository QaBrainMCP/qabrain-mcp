import { ExecutionStep } from "./execution-step.model.js";

export interface ExecutionPlan {
    featureName: string;
    scenarioName: string;
    executionSteps: ExecutionStep[];
    estimatedStepCount: number;
    createdAt: string;
}
