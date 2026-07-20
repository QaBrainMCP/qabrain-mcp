import type PageContext from "../../mcp/models/page-context.js";
import type ComponentContext from "../../mcp/models/component-context.js";
import type VerificationContext from "../../mcp/models/verification-context.js";

export interface GenerationContext {
    application: string;
    feature?: string;
    page: PageContext;
    components: ComponentContext[];
    navigation?: {
        previousPages: string[];
        nextPages: string[];
        navigationComponents: string[];
        menuPath: string[];
    };
    verification?: VerificationContext;
    dependencies?: Record<string, unknown>;
    knowledgeHealth?: {
        status: 'Complete' | 'Partial' | 'Missing Components' | 'Missing Locators' | 'Missing Verification';
        missingComponents?: string[];
        missingLocators?: string[];
        missingVerification?: string[];
    };
    metadata?: Record<string, unknown>;
    recommendedAutomationNames?: Record<string, string>;
}

export default GenerationContext;
