import { ExecutionActionType } from "./execution-step.model.js";

export type ResolutionMethod =
    | "KNOWLEDGE"
    | "DISCOVERY"
    | "AMBIGUOUS"
    | "UNRESOLVED";

export interface ResolvedStepAlternative {
    componentName: string;
    componentType: string;
    locator: string;
    confidence: number;
}

export interface ResolvedStep {
    action: ExecutionActionType;
    target: string | null;
    matchedComponent: {
        name: string;
        type: string;
        selector: string;
    } | null;
    selectedLocator: string | null;
    confidence: number;
    alternatives: ResolvedStepAlternative[];
    resolutionMethod: ResolutionMethod;
    discoveryPerformed: boolean;
    ambiguityWarning?: string;
}
