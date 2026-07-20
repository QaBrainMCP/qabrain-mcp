import { registerSkill } from "../skill-registry.js";
import type { AISkill } from "../skill-engine.js";
import type { SkillRequest } from "../skill-context.js";
import type { SkillResult } from "../skill-result.js";

const skill: AISkill = {
    name: "generate_test",
    description: "Prepare generation context for test generation",
    async execute(request: SkillRequest): Promise<SkillResult> {
        const start = Date.now();
        const aiInstructions = "Generate an end-to-end test using Page Objects and step definitions. Do not include Playwright/Selenium/Cypress/Appium code. Provide structured test steps only.";
        return { page: request.page, aiInstructions, elapsedMs: Date.now() - start } as SkillResult;
    }
};

registerSkill(skill);
