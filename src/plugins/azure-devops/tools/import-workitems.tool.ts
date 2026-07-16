import { workItemService } from "../services/workitem.service.js";

export interface ImportWorkItemsInput { project: string; }

export async function importWorkItems(input: ImportWorkItemsInput) {
    return workItemService.importWorkItems(input.project);
}
