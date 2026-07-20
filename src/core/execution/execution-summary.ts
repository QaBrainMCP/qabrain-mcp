export interface ExecutionSummary {
    pagesLearned: number;
    componentsLearned: number;
    validatedComponents: number;
    validatedLocators: number;
    missingComponents: number;
    duplicateComponentsRemoved: number;
    knowledgeUpdates: { newComponents: number; updatedComponents: number };
    executionTime: number;
    coverage: number; // 0-100
}

export default ExecutionSummary;
