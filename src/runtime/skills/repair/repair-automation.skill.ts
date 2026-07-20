import { registerSkill } from "../skill-registry.js";
import type { AISkill } from "../skill-engine.js";
import type { SkillRequest } from "../skill-context.js";
import type { SkillResult } from "../skill-result.js";

const skill: AISkill = {
    name: "repair_automation",
    description: "Prepare generation context for repairing automation artifacts",
    async execute(request: SkillRequest): Promise<SkillResult> {
        const start = Date.now();
        const aiInstructions = "Identify missing locators or outdated automation names and provide instructions to repair the Page Object or selectors. Do not output code.";
        return { page: request.page, aiInstructions, elapsedMs: Date.now() - start } as SkillResult;
    }
};

registerSkill(skill);
