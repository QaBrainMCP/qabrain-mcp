import { Workflow } from "../models/workflow.model.js";

export class WorkflowMemoryService {

    private workflows: Workflow[] = [];

    remember(workflow: Workflow): Workflow {

        this.workflows.push(workflow);

        return workflow;

    }

    getAll(): Workflow[] {

        return this.workflows;

    }

    findByName(name: string): Workflow | undefined {

        return this.workflows.find(w => w.name === name);

    }

}

export const workflowMemory = new WorkflowMemoryService();