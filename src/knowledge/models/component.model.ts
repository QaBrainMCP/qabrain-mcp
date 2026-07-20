export type ComponentType =
    | "button"
    | "link"
    | "input"
    | "dropdown"
    | "form"
    | "table"
    | "dialog";

export type ComponentRelationshipType =
    | "form_inputs"
    | "table_columns"
    | "menu_items"
    | "dialog_buttons"
    | "navigation_target_pages";

export interface ComponentRelationship {
    type: ComponentRelationshipType;
    targets: string[];
}

export interface ComponentMetadata {
    "data-testid"?: string;
    "data-test"?: string;
    "data-qa"?: string;
    id?: string;
    name?: string;
    nameAttribute?: string;
    text?: string;
    tagName?: string;
    role?: string;
    "aria-label"?: string;
    placeholder?: string;
    title?: string;
    alt?: string;
    class?: string;
    href?: string;
    type?: string;
    disabled?: boolean;
    visible?: boolean;
    required?: boolean;
    "readonly"?: boolean;
}

export interface Component {
    type: ComponentType;
    name: string;
    selector: string;
    metadata?: ComponentMetadata;
    locatorStrategy?: string;
    relationships?: ComponentRelationship[];
    structureTags?: string[];
    candidateLocators?: Array<{
        strategy: string;
        value: string;
        matchedCount: number;
        isUnique: boolean;
        isValid: boolean;
        automationRisk: "low" | "medium" | "high";
        selfHealingCandidate: boolean;
        confidence: number;
        stability: number;
        uniqueness: number;
        maintainability: number;
        readability: number;
        readable: number;
        generatedBy: string;
        scoreBreakdown: {
            uniquenessScore: number;
            stabilityScore: number;
            readabilityScore: number;
            maintainabilityScore: number;
            frameworkCompatibilityScore: number;
        };
        failureReasons: string[];
        recommendations: string[];
        explanation: string;
    }>;
    fallbackLocators?: Array<{
        strategy: string;
        value: string;
        matchedCount: number;
        isUnique: boolean;
        isValid: boolean;
        automationRisk: "low" | "medium" | "high";
        selfHealingCandidate: boolean;
        confidence: number;
        stability: number;
        uniqueness: number;
        maintainability: number;
        readability: number;
        readable: number;
        generatedBy: string;
        scoreBreakdown: {
            uniquenessScore: number;
            stabilityScore: number;
            readabilityScore: number;
            maintainabilityScore: number;
            frameworkCompatibilityScore: number;
        };
        failureReasons: string[];
        recommendations: string[];
        explanation: string;
    }>;
    frameworkLocators?: Record<string, string>;
}
