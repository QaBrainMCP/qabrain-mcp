import type { ExecutionPlan } from "../../execution-plan.js";

export function buildPlan(goal: string, intent: string, analysis: any): ExecutionPlan {
    const plan: ExecutionPlan = { goal, steps: [] };

    if (intent === 'complete_automation') {
        // if analysis complete, include full skills
        if (analysis.complete) {
            plan.steps = ['generate_page_object', 'generate_step_definitions', 'generate_test'];
            plan.decision = { decision: 'repository_complete', reasoning: 'Repository appears complete', chosenSkills: plan.steps };
            return plan;
        }

        // incomplete -> recommend learning
        if (analysis.missingComponents && analysis.missingComponents.length > 0) {
            plan.steps = [];
            plan.decision = {
                decision: 'learning_required',
                reasoning: 'Missing components detected',
                chosenSkills: [],
                skippedSkills: ['generate_page_object','generate_step_definitions','generate_test'],
                knowledgeGaps: analysis.missingComponents,
                recommendations: ['Run learn_feature to populate repository before generation']
            };
            return plan;
        }

        if (analysis.missingLocators && analysis.missingLocators.length > 0) {
            plan.steps = ['repair_automation'];
            plan.decision = { decision: 'repair_required', reasoning: 'Missing locators detected', chosenSkills: plan.steps, knowledgeGaps: analysis.missingLocators, recommendations: ['Run repair automation to fix locators'] };
            return plan;
        }
    }

    // map other intents
    if (intent === 'page_object') {
        plan.steps = ['generate_page_object'];
        plan.decision = { decision: 'generate_page_object', chosenSkills: plan.steps };
        return plan;
    }

    if (intent === 'step_definitions') {
        plan.steps = ['generate_step_definitions'];
        plan.decision = { decision: 'generate_step_definitions', chosenSkills: plan.steps };
        return plan;
    }

    if (intent === 'test') {
        plan.steps = ['generate_test'];
        plan.decision = { decision: 'generate_test', chosenSkills: plan.steps };
        return plan;
    }

    if (intent === 'repair') {
        plan.steps = ['repair_automation'];
        plan.decision = { decision: 'repair_automation', chosenSkills: plan.steps };
        return plan;
    }

    if (intent === 'explain') {
        plan.steps = ['explain_page'];
        plan.decision = { decision: 'explain_page', chosenSkills: plan.steps };
        return plan;
    }

    // fallback
    plan.steps = ['generate_page_object'];
    plan.decision = { decision: 'fallback', chosenSkills: plan.steps };
    return plan;
}
