export interface ExecutionPlan {
    goal: string;
    steps: string[]; // skill names in order
    decision?: {
        decision: string;
        reasoning?: string;
        executionStrategy?: string;
        chosenSkills?: string[];
        skippedSkills?: string[];
        knowledgeGaps?: string[];
        recommendations?: string[];
    };
}

export default ExecutionPlan;
