import type { MCPTool } from "../registry/tool.registry.js";
import { agentEngine } from "../../runtime/agent/agent-engine.js";
import { logger } from "../../utils/logger.js";

export const ExecuteGoalTool: MCPTool<any> = {
    name: "execute_goal",
    description: "Execute a high-level goal by orchestrating registered skills (returns structured context only)",
    async execute(input: { goal: string; sessionId: string }) {
        logger.info({ goal: input.goal, sessionId: input.sessionId }, "Execute Goal Requested");
        const resp = await agentEngine.executeGoal(input.goal, input.sessionId);
        return resp;
    }
};
