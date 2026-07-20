import type { MCPTool } from "../registry/tool.registry.js";
import { automationSessionManager } from "../../runtime/automation-session-manager.js";
import { logger } from "../../utils/logger.js";

export const StartAutomationSessionTool: MCPTool<any> = {
    name: "start_automation_session",
    description: "Start an automation session and cache repository context",
    async execute(input: { application: string; feature?: string }) {
        logger.info({ application: input.application, feature: input.feature }, "Start Session Requested");
        const resp = await automationSessionManager.startSession({ application: input.application, feature: input.feature });
        return resp;
    }
};
