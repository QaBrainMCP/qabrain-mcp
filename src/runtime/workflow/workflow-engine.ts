import { generationContextService } from "./generation-context.service.js";
import { logger } from "../../utils/logger.js";

export class WorkflowEngine {
    async prepareGenerationContext(sessionId: string, pageName: string) {
        logger.info({ sessionId, pageName }, "WorkflowEngine: prepareGenerationContext");
        const ctx = await generationContextService.prepare(sessionId, pageName);
        return ctx;
    }
}

export const workflowEngine = new WorkflowEngine();
