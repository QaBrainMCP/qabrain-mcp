export type AzureWorkItemType = "Epic" | "Feature" | "User Story" | "Task" | "Bug" | "Test Case" | "Other";

export interface AzureWorkItem {
    id: number;
    title: string;
    type: AzureWorkItemType;
    state: string;
    url: string;
    parentId: number | null;
}
