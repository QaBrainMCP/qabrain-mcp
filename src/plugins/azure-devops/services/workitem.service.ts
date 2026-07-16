import { AzureClient, AzureWorkItemResponse, azureClient } from "../client/azure.client.js";
import { AzureWorkItem, AzureWorkItemType } from "../models/workitem.model.js";
import { AzureRepository, azureRepository } from "../repository/azure.repository.js";

export class WorkItemService {
    constructor(
        private readonly client: AzureClient = azureClient,
        private readonly repository: AzureRepository = azureRepository
    ) {}

    async importWorkItems(project: string): Promise<AzureWorkItem[]> {
        const workItems = (await this.client.listWorkItems(project)).map(item => this.toWorkItem(item));
        this.repository.saveWorkItems(workItems);
        this.repository.saveBugs(workItems.filter(item => item.type === "Bug").map(item => ({
            id: item.id, title: item.title, state: item.state, url: item.url
        })));
        return workItems;
    }

    private toWorkItem(item: AzureWorkItemResponse): AzureWorkItem {
        const fields = item.fields ?? {};
        return {
            id: item.id,
            title: this.stringField(fields, "System.Title", "Untitled"),
            type: this.typeFor(this.stringField(fields, "System.WorkItemType", "Other")),
            state: this.stringField(fields, "System.State", "Unknown"),
            url: item.url,
            parentId: this.parentId(item)
        };
    }

    private stringField(fields: Record<string, unknown>, name: string, fallback: string): string {
        const value = fields[name];
        return typeof value === "string" ? value : fallback;
    }

    private typeFor(type: string): AzureWorkItemType {
        return ["Epic", "Feature", "User Story", "Task", "Bug", "Test Case"].includes(type)
            ? type as AzureWorkItemType
            : "Other";
    }

    private parentId(item: AzureWorkItemResponse): number | null {
        const parent = item.relations?.find(relation => relation.rel === "System.LinkTypes.Hierarchy-Reverse")?.url;
        const match = parent?.match(/workItems\/(\d+)$/i);
        return match ? Number(match[1]) : null;
    }
}

export const workItemService = new WorkItemService();
