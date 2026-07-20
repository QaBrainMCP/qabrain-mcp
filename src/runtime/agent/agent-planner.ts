import type { ExecutionPlan } from "./execution-plan.js";
import { decide } from "./planning/decision-engine.js";

export async function planForGoal(goal: string): Promise<ExecutionPlan> {
    const result = await decide(goal);
    const plan: ExecutionPlan = result.plan;
    // enhance decision with returned metadata
    plan.decision = plan.decision ?? {
        decision: result.decision,
        reasoning: result.reasoning,
        executionStrategy: result.executionStrategy,
        chosenSkills: result.chosenSkills,
        skippedSkills: result.skippedSkills,
        knowledgeGaps: result.knowledgeGaps,
        recommendations: result.recommendations,
    };
    return plan;
}
