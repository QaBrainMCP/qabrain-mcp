import { workflowEngine } from "../workflow/workflow-engine.js";
import { getSkill, listSkills, registerSkill } from "./skill-registry.js";
import type { SkillRequest } from "./skill-context.js";
import type { SkillResult } from "./skill-result.js";
import { logger } from "../../utils/logger.js";

export interface AISkill {
    name: string;
    description: string;
    execute(request: SkillRequest): Promise<SkillResult>;
}

export class SkillEngine {
    private skillsLoaded = false;

    private async ensureSkillsLoaded() {
        if (this.skillsLoaded) return;
        try {
            await import("./page-object/generate-page-object.skill.js");
            await import("./steps/generate-step-definitions.skill.js");
            await import("./tests/generate-test.skill.js");
            await import("./repair/repair-automation.skill.js");
            await import("./explain/explain-page.skill.js");
            this.skillsLoaded = true;
            logger.info({}, "Skills Bootstrapped");
        } catch (err) {
            logger.error({ err }, "Failed to bootstrap skills");
        }
    }

    async executeSkill(request: SkillRequest): Promise<SkillResult> {
        await this.ensureSkillsLoaded();
        logger.info({ skill: request.skill, sessionId: request.sessionId, page: request.page }, "Skill Started");
        const skill = getSkill(request.skill);
        if (!skill) throw new Error(`Skill not found: ${request.skill}`);

        const ctx = await workflowEngine.prepareGenerationContext(request.sessionId, request.page);

        const result = await skill.execute(request);

        logger.info({ skill: request.skill, elapsedMs: result.elapsedMs ?? 0 }, "Skill Completed");
        return result;
    }
}

export const skillEngine = new SkillEngine();
