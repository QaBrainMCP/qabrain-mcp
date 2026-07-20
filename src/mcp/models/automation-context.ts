import type PageContext from "./page-context.js";
import type ComponentContext from "./component-context.js";
import type VerificationContext from "./verification-context.js";

export interface AutomationContext {
    application?: string;
    page: PageContext;
    navigation?: {
        previousPages: string[];
        nextPages: string[];
        navigationComponents: string[];
        menuPath: string[];
    };
    components: ComponentContext[];
    verification?: VerificationContext;
    dependencies?: {
        loginRequired?: boolean;
        roleRequired?: string | null;
        modalRequired?: boolean;
        preconditions?: string[];
    };
    metadata?: {
        confidence?: number;
        snapshotVersion?: string | null;
        repositoryVersion?: string | null;
        lastLearned?: string | null;
    };
}

export default AutomationContext;
