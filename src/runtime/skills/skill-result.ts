export interface SkillResult {
    application?: string;
    page?: string;
    components?: unknown[];
    locators?: unknown[];
    navigation?: unknown;
    verification?: unknown;
    dependencies?: unknown;
    knowledgeHealth?: unknown;
    automationNames?: Record<string,string>;
    aiInstructions?: string;
    elapsedMs?: number;
}

export default SkillResult;
