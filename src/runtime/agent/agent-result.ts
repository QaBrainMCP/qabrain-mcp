import type { ExecutionPlan } from "./execution-plan.js";
import type { SkillResult } from "../skills/skill-result.js";

export interface AgentResult {
    goal: string;
    plan: ExecutionPlan;
    executed: { skill: string; result?: SkillResult; error?: string; continued: boolean }[];
    knowledgeHealth?: unknown;
    recommendations?: string[];
    elapsedMs?: number;
}

export default AgentResult;
