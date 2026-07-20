import type { MCPTool } from "../registry/tool.registry.js";
import { automationSessionManager } from "../../runtime/automation-session-manager.js";
import { logger } from "../../utils/logger.js";

export const GetSessionContextTool: MCPTool<any> = {
    name: "get_session_context",
    description: "Get cached session context by sessionId",
    async execute(input: { sessionId: string }) {
        logger.info({ sessionId: input.sessionId }, "Get Session Context Requested");
        const ctx = await automationSessionManager.getSessionContext(input.sessionId);
        if (!ctx) return { status: 'not_found' };
        return ctx;
    }
};
