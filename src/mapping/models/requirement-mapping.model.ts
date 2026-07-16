export interface RequirementMapping {
    application: string;
    pages: string[];
    elements: string[];
    workflow: string | null;
    knownLocators: string[];
    confidence: number;
}

export interface RequirementMappingInput {
    feature: string;
}
