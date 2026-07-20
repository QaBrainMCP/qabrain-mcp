import { ExecutionStep } from "../../../feature-learning/models/execution-step.model.js";
import { OptimizedContext } from "../../optimizer/models/optimized-context.js";
import { AIDecision } from "../models/ai-decision.js";
import { PlannedAction } from "../models/reasoning-result.js";

export class ActionPlannerService {
    plan(decision: AIDecision, context: OptimizedContext, step: ExecutionStep): PlannedAction[] {
        const actions: PlannedAction[] = [];

        if (
            step.actionType === "CLICK" &&
            context.pageState.sidebarExpanded === false &&
            this.looksLikeNavigationTarget(step.target, context)
        ) {
            actions.push({
                type: "EXPAND_SIDEBAR",
                description: "Expand sidebar before attempting to click target menu item"
            });
        }

        actions.push({
            type: "EXECUTE_FEATURE_STEP",
            description: `Execute feature step action ${decision.requiredAction}`
        });

        actions.push({
            type: "VERIFY_EXPECTATION",
            description: "Verify expected page state after execution"
        });

        return actions;
    }

    private looksLikeNavigationTarget(target: string | null, context: OptimizedContext): boolean {
        if (!target) {
            return false;
        }
        const normalized = target.toLowerCase();
        return context.interactiveComponentsSummary.navigationItems.some(item =>
            item.toLowerCase().includes(normalized)
        );
    }
}

export const actionPlannerService = new ActionPlannerService();
