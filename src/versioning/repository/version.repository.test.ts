import { describe, expect, it } from "vitest";
import { VersionRepository } from "./version.repository.js";

describe("VersionRepository", () => {
    it("stores snapshots and versions", () => {
        const repository = new VersionRepository();
        const snapshot = {
            id: "snapshot-1", application: "Playwright", pages: [], workflows: [], createdAt: new Date()
        };
        repository.saveSnapshot(snapshot);
        repository.saveVersion({
            version: "1.0.0", snapshotId: snapshot.id, previousSnapshotId: null, changes: [],
            risk: "LOW", recommendations: [], createdAt: new Date()
        });

        expect(repository.getSnapshot(snapshot.id)).toEqual(snapshot);
        expect(repository.getVersions()).toHaveLength(1);
    });
});
