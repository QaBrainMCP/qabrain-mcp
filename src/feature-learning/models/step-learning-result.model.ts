import { ExecutionContext } from "../../ai/context/models/execution-context.js";
import { ReasoningResult } from "../../ai/reasoning/models/reasoning-result.js";
import { BusinessIntentType } from "../../application-model/models/business-intent.js";

export interface StepLearningResult {
    stepNumber: number;
    stepText: string;
    pageTitle: string;
    pageUrl: string;
    discoveredComponents: number;
    validatedLocators: number;
    newComponents: number;
    updatedComponents: number;
    executionTime: number;
    resolvedComponent: string;
    componentFound: "YES" | "NO";
    generatedLocator: string | null;
    validationStatus: "VALIDATED" | "NOT_VALIDATED" | "CRITICAL";
    confidence: number;
    alternativeLocators: string[];
    businessIntent?: BusinessIntentType;
    executionStrategy?: string[];
    strategyConfidence?: number;
    aiRequired?: boolean;
    aiReason?: string;
    beforeContext?: ExecutionContext;
    afterContext?: ExecutionContext;
    reasoningResult?: ReasoningResult;
    screenshotPath?: string;
}
