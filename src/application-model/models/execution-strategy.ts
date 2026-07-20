export type StrategyActionType =
    | "VERIFY_CURRENT_PAGE"
    | "EXPAND_SIDEBAR"
    | "LOCATE_TARGET"
    | "VALIDATE_LOCATOR"
    | "EXECUTE_STEP"
    | "VERIFY_EXPECTATION";

export interface StrategyAction {
    type: StrategyActionType;
    description: string;
    target: string | null;
}

export interface ExecutionStrategy {
    goal: string;
    businessIntent: string;
    actions: StrategyAction[];
    confidence: number;
    expectedDestination: string | null;
    reason: string;
}
