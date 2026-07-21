import { WorkflowKnowledge } from "./types.js";

export class WorkflowDiscovery {
    async detect(): Promise<WorkflowKnowledge[]> {
        // Placeholder: real implementation should inspect user flows
        return [];
    }
}

export const workflowDiscovery = new WorkflowDiscovery();
