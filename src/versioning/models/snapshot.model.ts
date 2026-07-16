export interface SnapshotPage {
    title: string;
    url: string;
    components: string[];
    locators: string[];
}

export interface SnapshotWorkflow {
    name: string;
    pages: string[];
    actions: string[];
    locators: string[];
}

export interface ApplicationSnapshot {
    id: string;
    application: string;
    pages: SnapshotPage[];
    workflows: SnapshotWorkflow[];
    createdAt: Date;
}
