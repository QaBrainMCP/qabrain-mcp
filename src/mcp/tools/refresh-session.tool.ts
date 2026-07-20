import type { MCPTool } from "../registry/tool.registry.js";
import { automationSessionManager } from "../../runtime/automation-session-manager.js";
import { logger } from "../../utils/logger.js";

export const RefreshSessionTool: MCPTool<any> = {
    name: "refresh_session",
    description: "Refresh a session by reloading repository and updating cache",
    async execute(input: { sessionId: string }) {
        logger.info({ sessionId: input.sessionId }, "Refresh Session Requested");
        const resp = await automationSessionManager.refreshSession(input.sessionId);
        return resp ?? { status: 'not_found' };
    }
};
