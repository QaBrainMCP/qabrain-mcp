import { ExecutionStep } from "../../../feature-learning/models/execution-step.model.js";
import { OptimizedContext } from "../../optimizer/models/optimized-context.js";
import { AIDecision } from "../models/ai-decision.js";

export class AIDecisionService {
    decide(context: OptimizedContext, step: ExecutionStep): AIDecision {
        const stepText = `${step.keyword} ${step.originalStep.text}`;
        const targetComponent = step.target;

        const businessIntent = this.intentFromAction(step.actionType, targetComponent);
        const expectedPage = this.expectedPage(step);
        const expectedComponents = targetComponent ? [targetComponent] : [];
        const recoveryActions = this.recoveryForAction(step.actionType);

        let confidence = 60;
        if (context.pageState.readyForInteraction) confidence += 10;
        if (targetComponent && context.interactiveComponentsSummary.visibleInteractiveElements.some(item =>
            item.toLowerCase().includes(targetComponent.toLowerCase())
        )) confidence += 20;
        if (context.knownComponents > 0) confidence += 10;
        confidence = Math.min(100, confidence);

        return {
            currentPage: context.pageTitle,
            businessIntent,
            requiredAction: step.actionType,
            targetComponent,
            confidence,
            expectedPage,
            expectedComponents,
            recoveryActions,
            reasoning: `${stepText} on ${context.currentUrl}`
        };
    }

    private intentFromAction(action: ExecutionStep["actionType"], target: string | null): string {
        switch (action) {
            case "NAVIGATE":
                return `Navigate to ${target ?? "target application"}`;
            case "INPUT":
                return `Provide input for ${target ?? "field"}`;
            case "CLICK":
                return `Trigger ${target ?? "action"}`;
            case "VERIFY":
                return `Verify ${target ?? "expected state"}`;
            default:
                return "Handle custom workflow instruction";
        }
    }

    private expectedPage(step: ExecutionStep): string | null {
        if (step.actionType === "VERIFY") {
            return step.target ?? null;
        }
        if (step.actionType === "CLICK") {
            return step.target ?? null;
        }
        return null;
    }

    private recoveryForAction(action: ExecutionStep["actionType"]): string[] {
        switch (action) {
            case "CLICK":
                return ["Expand navigation if collapsed", "Retry click using alternative locator", "Refresh page context"];
            case "INPUT":
                return ["Refocus target input", "Retry using label/placeholder", "Fallback to known locator"];
            case "NAVIGATE":
                return ["Resolve target URL from context", "Fallback to direct URL", "Open app root and retry"];
            case "VERIFY":
                return ["Wait for page readiness", "Verify heading then URL", "Capture diagnostics and retry"];
            default:
                return ["Skip with warning", "Capture context for manual review"];
        }
    }
}

export const aiDecisionService = new AIDecisionService();
