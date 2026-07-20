import { ExecutionActionType } from "../../../feature-learning/models/execution-step.model.js";

export interface AIDecision {
    currentPage: string;
    businessIntent: string;
    requiredAction: ExecutionActionType;
    targetComponent: string | null;
    confidence: number;
    expectedPage: string | null;
    expectedComponents: string[];
    recoveryActions: string[];
    reasoning: string;
}
