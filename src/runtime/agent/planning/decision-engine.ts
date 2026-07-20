import { analyzeKnowledge } from "./knowledge-analyzer.js";
import { classifyGoal } from "./goal-classifier.js";
import { buildPlan } from "./plan-builder.js";
import { chooseStrategy } from "./execution-strategy.js";

export async function decide(goal: string) {
    const analysis = await analyzeKnowledge();
    const intent = classifyGoal(goal);
    const plan = buildPlan(goal, intent, analysis);

    const decision = plan.decision?.decision ?? (analysis.complete ? 'repository_complete' : 'partial');
    const strategy = chooseStrategy(decision);

    return {
        decision,
        reasoning: plan.decision?.reasoning ?? '',
        executionStrategy: strategy,
        chosenSkills: plan.steps,
        skippedSkills: plan.decision?.skippedSkills ?? [],
        knowledgeGaps: plan.decision?.knowledgeGaps ?? [...analysis.missingComponents, ...analysis.missingLocators, ...analysis.missingVerification],
        recommendations: plan.decision?.recommendations ?? [] ,
        plan
    };
}
