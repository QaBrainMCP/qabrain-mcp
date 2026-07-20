import { registerSkill } from "../skill-registry.js";
import type { AISkill } from "../skill-engine.js";
import type { SkillRequest } from "../skill-context.js";
import type { SkillResult } from "../skill-result.js";

const skill: AISkill = {
    name: "generate_step_definitions",
    description: "Prepare generation context for step definitions",
    async execute(request: SkillRequest): Promise<SkillResult> {
        const start = Date.now();
        const aiInstructions = "Generate step definitions using the recommended automation names. Do not generate implementation code; provide mapping between Gherkin steps and automation names.";
        return { page: request.page, aiInstructions, elapsedMs: Date.now() - start } as SkillResult;
    }
};

registerSkill(skill);
