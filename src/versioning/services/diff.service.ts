import { KnowledgeChange } from "../models/change.model.js";
import { ApplicationSnapshot, SnapshotPage, SnapshotWorkflow } from "../models/snapshot.model.js";

export class DiffService {
    compare(previous: ApplicationSnapshot, current: ApplicationSnapshot): KnowledgeChange[] {
        return [
            ...this.pageChanges(previous.pages, current.pages),
            ...this.workflowChanges(previous.workflows, current.workflows)
        ];
    }

    private pageChanges(previous: readonly SnapshotPage[], current: readonly SnapshotPage[]): KnowledgeChange[] {
        const changes: KnowledgeChange[] = [];
        const previousByTitle = new Map(previous.map(page => [page.title, page]));
        const currentByTitle = new Map(current.map(page => [page.title, page]));
        current.forEach(page => {
            const before = previousByTitle.get(page.title);
            if (!before) {
                changes.push({ type: "NEW_PAGE", page: page.title });
                page.components.forEach(component => changes.push({ type: "NEW_COMPONENT", page: page.title, component }));
                page.locators.forEach(locator => changes.push({ type: "NEW_LOCATOR", page: page.title, locator }));
                return;
            }
            const componentChanges = this.valueChanges(before.components, page.components, page.title, "COMPONENT");
            const locatorChanges = this.valueChanges(before.locators, page.locators, page.title, "LOCATOR");
            if (before.url !== page.url || componentChanges.length > 0 || locatorChanges.length > 0) {
                changes.push({ type: "UPDATED_PAGE", page: page.title });
            }
            changes.push(...componentChanges, ...locatorChanges);
        });
        previous.forEach(page => {
            if (!currentByTitle.has(page.title)) {
                changes.push({ type: "REMOVED_PAGE", page: page.title });
                page.components.forEach(component => changes.push({ type: "REMOVED_COMPONENT", page: page.title, component }));
                page.locators.forEach(locator => changes.push({ type: "REMOVED_LOCATOR", page: page.title, locator }));
            }
        });
        return changes;
    }

    private workflowChanges(previous: readonly SnapshotWorkflow[], current: readonly SnapshotWorkflow[]): KnowledgeChange[] {
        const changes: KnowledgeChange[] = [];
        const previousByName = new Map(previous.map(workflow => [workflow.name, workflow]));
        const currentByName = new Map(current.map(workflow => [workflow.name, workflow]));
        current.forEach(workflow => {
            const before = previousByName.get(workflow.name);
            if (!before) changes.push({ type: "NEW_WORKFLOW", workflow: workflow.name });
            else if (!this.same(before.pages, workflow.pages) || !this.same(before.actions, workflow.actions) ||
                !this.same(before.locators, workflow.locators)) {
                changes.push({ type: "UPDATED_WORKFLOW", workflow: workflow.name });
            }
        });
        previous.forEach(workflow => {
            if (!currentByName.has(workflow.name)) changes.push({ type: "REMOVED_WORKFLOW", workflow: workflow.name });
        });
        return changes;
    }

    private valueChanges(
        previous: readonly string[],
        current: readonly string[],
        page: string,
        kind: "COMPONENT" | "LOCATOR"
    ): KnowledgeChange[] {
        const added = current.filter(value => !previous.includes(value));
        const removed = previous.filter(value => !current.includes(value));
        if (added.length === 1 && removed.length === 1) {
            return [kind === "COMPONENT"
                ? { type: "UPDATED_COMPONENT", page, component: added[0] }
                : { type: "UPDATED_LOCATOR", page, locator: added[0] }];
        }
        return [
            ...added.map(value => kind === "COMPONENT"
                ? ({ type: "NEW_COMPONENT" as const, page, component: value })
                : ({ type: "NEW_LOCATOR" as const, page, locator: value })),
            ...removed.map(value => kind === "COMPONENT"
                ? ({ type: "REMOVED_COMPONENT" as const, page, component: value })
                : ({ type: "REMOVED_LOCATOR" as const, page, locator: value }))
        ];
    }

    private same(left: readonly string[], right: readonly string[]): boolean {
        return left.length === right.length && left.every(value => right.includes(value));
    }
}

export const diffService = new DiffService();
