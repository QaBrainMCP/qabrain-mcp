import type { MCPTool } from "../registry/tool.registry.js";
import { automationSessionManager } from "../../runtime/automation-session-manager.js";
import { logger } from "../../utils/logger.js";

export const CloseSessionTool: MCPTool<any> = {
    name: "close_session",
    description: "Close and remove a session, returning statistics",
    async execute(input: { sessionId: string }) {
        logger.info({ sessionId: input.sessionId }, "Close Session Requested");
        const resp = await automationSessionManager.closeSession(input.sessionId);
        return resp;
    }
};
