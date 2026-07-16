export type ChangeType =
    | "NEW_PAGE"
    | "REMOVED_PAGE"
    | "UPDATED_PAGE"
    | "NEW_COMPONENT"
    | "REMOVED_COMPONENT"
    | "UPDATED_COMPONENT"
    | "NEW_WORKFLOW"
    | "UPDATED_WORKFLOW"
    | "REMOVED_WORKFLOW"
    | "NEW_LOCATOR"
    | "UPDATED_LOCATOR"
    | "REMOVED_LOCATOR";

export interface KnowledgeChange {
    type: ChangeType;
    page?: string;
    component?: string;
    workflow?: string;
    locator?: string;
}
