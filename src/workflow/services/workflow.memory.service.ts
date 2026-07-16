import { Workflow } from "../models/workflow.model.js";

export class WorkflowMemoryService {
    private workflows: Workflow[] = [];
    private readonly workflowByName = new Map<string, Workflow>();

    remember(workflow: Workflow): Workflow {
        this.workflows.push(workflow);
        this.workflowByName.set(workflow.name, workflow);
        return workflow;
    }

    getAll(): Workflow[] {
        return [...this.workflows];
    }

    findByName(name: string): Workflow | undefined {
        return this.workflowByName.get(name);
    }

    clear(): void {
        this.workflows = [];
        this.workflowByName.clear();
    }
}

export const workflowMemory = new WorkflowMemoryService();
