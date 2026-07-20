import { planForGoal } from "./agent-planner.js";
import { analyzeGoal } from "./goal-analyzer.js";
import { skillEngine } from "../skills/skill-engine.js";
import { automationSessionManager } from "../automation-session-manager.js";
import { logger } from "../../utils/logger.js";
import type { AgentResult } from "./agent-result.js";

export class AgentEngine {
    async executeGoal(goal: string, sessionId: string) {
        const start = Date.now();
        logger.info({ goal, sessionId }, "Goal Received");

        // analyze goal
        const primarySkill = analyzeGoal(goal);

        // plan
        const plan = await planForGoal(goal);
        logger.info({ goal, plan: plan.steps, decision: plan.decision?.decision }, "Plan Created");

        const executed: AgentResult['executed'] = [];

        // ensure session exists
        const session = await automationSessionManager.getSessionContext(sessionId as any);
        if (!session) {
            return { goal, plan, executed, recommendations: ['session_not_found'], elapsedMs: Date.now() - start } as AgentResult;
        }

        // execute skills sequentially
        for (const skillName of plan.steps) {
            try {
                logger.info({ skill: skillName }, "Skill Executing");
                const res = await skillEngine.executeSkill({ skill: skillName, sessionId, page: (session as any).pageName ?? (session as any).cachedPages ? Object.values((session as any).cachedPages)[0]?.pageName ?? '' : '' } as any);
                executed.push({ skill: skillName, result: res, continued: true });
                logger.info({ skill: skillName }, "Skill Executed");
            } catch (err: any) {
                const msg = String(err?.message ?? err);
                // decide critical vs recoverable
                const critical = msg.toLowerCase().includes('critical') || msg.toLowerCase().includes('session_not_found');
                executed.push({ skill: skillName, error: msg, continued: !critical });
                logger.warn({ skill: skillName, error: msg, critical }, "Skill Execution Failed");
                if (critical) break;
            }
        }

        // basic recommendations based on executed results
        const recommendations: string[] = [];
        const lastResult = executed[executed.length - 1];
        if (!lastResult || lastResult.error) {
            recommendations.push('Review skill execution failures');
        } else {
            recommendations.push('Repository likely sufficient for generation');
        }

        const agentResult: AgentResult = {
            goal,
            plan,
            executed,
            recommendations,
            elapsedMs: Date.now() - start
        };

        logger.info({ goal, elapsedMs: agentResult.elapsedMs }, "Goal Completed");
        return agentResult;
    }
}

export const agentEngine = new AgentEngine();
