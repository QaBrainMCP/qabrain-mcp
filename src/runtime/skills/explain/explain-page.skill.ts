import { registerSkill } from "../skill-registry.js";
import type { AISkill } from "../skill-engine.js";
import type { SkillRequest } from "../skill-context.js";
import type { SkillResult } from "../skill-result.js";

const skill: AISkill = {
    name: "explain_page",
    description: "Produce a human-readable explanation of the page and its important components",
    async execute(request: SkillRequest): Promise<SkillResult> {
        const start = Date.now();
        const aiInstructions = "Summarize the page purpose, primary components, and verification points. Provide priorities for automation.";
        return { page: request.page, aiInstructions, elapsedMs: Date.now() - start } as SkillResult;
    }
};

registerSkill(skill);
