import { AIDecision } from "./ai-decision.js";

export type VerificationStatus = "PASS" | "FAIL";

export interface PlannedAction {
    type: "EXPAND_SIDEBAR" | "EXECUTE_FEATURE_STEP" | "VERIFY_EXPECTATION";
    description: string;
}

export interface VerificationResult {
    status: VerificationStatus;
    reason: string;
    expectedPage: string | null;
    expectedHeading: string | null;
    expectedComponent: string | null;
    expectedUrl: string | null;
}

export interface ReasoningResult {
    decision: AIDecision;
    plannedActions: PlannedAction[];
    verification: VerificationResult;
}
