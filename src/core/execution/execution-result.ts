import { ExecutionStepResult } from "./execution-step-result.js";
import { ExecutionSummary } from "./execution-summary.js";

export interface ExecutionResultCore {
    feature: string;
    scenario: string;
    totalSteps: number;
    stepResults: ExecutionStepResult[];
    summary: ExecutionSummary;
}

export default ExecutionResultCore;
