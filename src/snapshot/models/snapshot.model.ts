import { SnapshotPage } from "./snapshot-page.model.js";

export interface Snapshot {
    id: string;
    applicationName: string;
    snapshotName: string;
    version: string;
    createdAt: Date;
    pages: SnapshotPage[];
}
