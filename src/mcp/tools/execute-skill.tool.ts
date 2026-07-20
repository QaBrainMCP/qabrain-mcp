import type { MCPTool } from "../registry/tool.registry.js";
import { skillEngine } from "../../runtime/skills/skill-engine.js";
import { logger } from "../../utils/logger.js";

export const ExecuteSkillTool: MCPTool<any> = {
    name: "execute_skill",
    description: "Execute a registered AI skill and return structured SkillResult (no code generation)",
    async execute(input: { skill: string; sessionId: string; page: string; options?: Record<string, unknown> }) {
        logger.info({ skill: input.skill, sessionId: input.sessionId, page: input.page }, "Execute Skill Requested");
        const req = { skill: input.skill, sessionId: input.sessionId, page: input.page, options: input.options };
        const result = await skillEngine.executeSkill(req as any);
        return result;
    }
};
