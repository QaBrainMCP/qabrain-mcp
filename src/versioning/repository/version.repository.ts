import { ApplicationSnapshot } from "../models/snapshot.model.js";
import { KnowledgeVersion } from "../models/version.model.js";

export class VersionRepository {
    private snapshots: ApplicationSnapshot[] = [];
    private versions: KnowledgeVersion[] = [];

    saveSnapshot(snapshot: ApplicationSnapshot): ApplicationSnapshot {
        this.snapshots.push(snapshot);
        return snapshot;
    }

    getSnapshot(id: string): ApplicationSnapshot | undefined {
        return this.snapshots.find(snapshot => snapshot.id === id);
    }

    getLatestSnapshot(application: string): ApplicationSnapshot | undefined {
        return [...this.snapshots].reverse().find(snapshot => snapshot.application === application);
    }

    getSnapshots(): ApplicationSnapshot[] {
        return [...this.snapshots];
    }

    saveVersion(version: KnowledgeVersion): KnowledgeVersion {
        this.versions.push(version);
        return version;
    }

    getVersions(): KnowledgeVersion[] {
        return [...this.versions];
    }

    clear(): void {
        this.snapshots = [];
        this.versions = [];
    }
}

export const versionRepository = new VersionRepository();
