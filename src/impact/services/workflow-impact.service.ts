import { Workflow } from "../../workflow/models/workflow.model.js";

export class WorkflowImpactService {
    find(changed: string, affectedPages: readonly string[], workflows: readonly Workflow[]): string[] {
        return workflows.filter(workflow =>
            [...workflow.pages, ...workflow.actions, ...workflow.locators].some(value => this.matches(changed, value)) ||
            workflow.pages.some(page => affectedPages.some(affected => this.matches(affected, page)))
        ).map(workflow => workflow.name);
    }

    private matches(expected: string, actual: string): boolean {
        return actual.toLowerCase().includes(expected.toLowerCase()) ||
            expected.toLowerCase().includes(actual.toLowerCase());
    }
}
