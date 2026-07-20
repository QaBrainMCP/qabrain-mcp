export type SnapshotChangeType = "added" | "removed" | "updated";

export interface LocatorChange {
    componentName: string;
    oldLocator: string | null;
    newLocator: string | null;
    changeType: SnapshotChangeType;
}
