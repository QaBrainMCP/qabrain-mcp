import { ComponentChange } from "./component-change.model.js";
import { LocatorChange } from "./locator-change.model.js";

export interface SnapshotDifference {
    pageUrl: string;
    addedComponents: string[];
    removedComponents: string[];
    changedComponents: ComponentChange[];
    locatorChanges: LocatorChange[];
    navigationChanges: ComponentChange[];
}
