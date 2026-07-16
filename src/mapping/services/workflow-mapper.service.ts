import { Workflow } from "../../workflow/models/workflow.model.js";

export class WorkflowMapperService {
    map(pageNames: readonly string[], workflows: readonly Workflow[]): Workflow | null {
        const pageSet = new Set(pageNames.map(page => page.toLowerCase()));
        const matched = workflows
            .map(workflow => ({
                workflow,
                score: workflow.pages.filter(page => pageSet.has(page.toLowerCase())).length
            }))
            .filter(candidate => candidate.score > 0)
            .sort((left, right) => right.score - left.score)[0];

        return matched?.workflow ?? null;
    }
}

export const workflowMapperService = new WorkflowMapperService();
