import type { MCPTool } from "../registry/tool.registry.js";
import { workflowEngine } from "../../runtime/workflow/workflow-engine.js";
import { logger } from "../../utils/logger.js";

export const PrepareGenerationContextTool: MCPTool<any> = {
    name: "prepare_generation_context",
    description: "Prepare a generation context for an AI assistant (read-only)",
    async execute(input: { sessionId: string; pageName: string }) {
        logger.info({ sessionId: input.sessionId, pageName: input.pageName }, "Prepare Generation Context Requested");
        const ctx = await workflowEngine.prepareGenerationContext(input.sessionId, input.pageName);
        return ctx;
    }
};
