import { FeatureStep, FeatureStepKeyword } from "./feature-step.model.js";

export type ExecutionActionType =
    | "NAVIGATE"
    | "INPUT"
    | "CLICK"
    | "VERIFY"
    | "CUSTOM";

export interface ExecutionStep {
    order: number;
    keyword: FeatureStepKeyword;
    originalStep: FeatureStep;
    actionType: ExecutionActionType;
    target: string | null;
    value: string | null;
    expectedState: string | null;
    requiresNavigation: boolean;
    requiresDiscovery: boolean;
    requiresLocatorValidation: boolean;
}
