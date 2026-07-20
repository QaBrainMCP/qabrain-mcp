import { SnapshotChangeType } from "./locator-change.model.js";

export interface ComponentChange {
    componentName: string;
    changeType: SnapshotChangeType;
    oldValue: string | null;
    newValue: string | null;
}
