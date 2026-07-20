import type { MCPTool } from "../registry/tool.registry.js";
import { automationSessionManager } from "../../runtime/automation-session-manager.js";
import { logger } from "../../utils/logger.js";

export const ListSessionsTool: MCPTool<any> = {
    name: "list_sessions",
    description: "List active automation sessions",
    async execute() {
        logger.info({}, "List Sessions Requested");
        const resp = await automationSessionManager.listSessions();
        return { sessions: resp };
    }
};
