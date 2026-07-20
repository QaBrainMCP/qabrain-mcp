import { registerSkill } from "../skill-registry.js";
import type { AISkill } from "../skill-engine.js";
import type { SkillRequest } from "../skill-context.js";
import type { SkillResult } from "../skill-result.js";

const skill: AISkill = {
    name: "generate_page_object",
    description: "Prepare generation context for page object generation",
    async execute(request: SkillRequest): Promise<SkillResult> {
        const start = Date.now();
        // The skill should orchestrate retrieval but not generate code.
        // We'll return guidance and the generation context placeholder.
        const aiInstructions = "Generate a Page Object for the page using recommended automation names and validated locators. Do not include test code. Use the Generation Context for component and locator details.";

        // lightweight placeholder: actual generation context already built by workflowEngine earlier
        const result: SkillResult = {
            application: request.page,
            page: request.page,
            aiInstructions,
            elapsedMs: Date.now() - start
        };

        return result;
    }
};

registerSkill(skill);
