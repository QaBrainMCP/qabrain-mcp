import { logger as defaultLogger } from "../../utils/logger.js";
import { Snapshot } from "../models/snapshot.model.js";

interface SnapshotLogger {
    info: (obj: Record<string, unknown>, msg?: string) => void;
    warn: (obj: Record<string, unknown>, msg?: string) => void;
}

export interface SnapshotRepository {
    saveSnapshot(snapshot: Snapshot): Snapshot;
    getSnapshot(snapshotId: string): Snapshot | undefined;
    getSnapshots(applicationName: string): Snapshot[];
    getLatestSnapshot(applicationName: string): Snapshot | undefined;
    deleteSnapshot(snapshotId: string): boolean;
    clear(): void;
    getSnapshotCount(): number;
}

export class InMemorySnapshotRepository implements SnapshotRepository {
    private snapshots: Snapshot[] = [];
    private readonly byId = new Map<string, Snapshot>();

    constructor(private readonly log: SnapshotLogger = defaultLogger) {}

    saveSnapshot(snapshot: Snapshot): Snapshot {
        const duplicate = this.snapshots.find(item =>
            item.applicationName === snapshot.applicationName &&
            item.version === snapshot.version &&
            item.snapshotName === snapshot.snapshotName
        );

        if (duplicate) {
            this.log.warn(
                {
                    snapshotId: snapshot.id,
                    duplicateId: duplicate.id,
                    applicationName: snapshot.applicationName,
                    version: snapshot.version,
                    snapshotName: snapshot.snapshotName
                },
                "Snapshot save rejected due to duplicate"
            );
            throw new Error(
                `Snapshot already exists for application=${snapshot.applicationName}, version=${snapshot.version}, snapshotName=${snapshot.snapshotName}`
            );
        }

        const stored = this.cloneSnapshot(snapshot);
        this.snapshots.push(stored);
        this.byId.set(stored.id, stored);

        this.log.info(
            {
                snapshotId: stored.id,
                applicationName: stored.applicationName,
                version: stored.version,
                snapshotName: stored.snapshotName,
                pageCount: stored.pages.length,
                totalCount: this.snapshots.length
            },
            "Snapshot saved"
        );

        return this.cloneSnapshot(stored);
    }

    getSnapshot(snapshotId: string): Snapshot | undefined {
        const snapshot = this.byId.get(snapshotId);

        this.log.info(
            {
                snapshotId,
                found: Boolean(snapshot)
            },
            "Snapshot loaded by id"
        );

        return snapshot ? this.cloneSnapshot(snapshot) : undefined;
    }

    getSnapshots(applicationName: string): Snapshot[] {
        const snapshots = this.snapshots
            .filter(item => item.applicationName === applicationName)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(item => this.cloneSnapshot(item));

        this.log.info(
            {
                applicationName,
                count: snapshots.length
            },
            "Snapshots loaded by application"
        );

        return snapshots;
    }

    getLatestSnapshot(applicationName: string): Snapshot | undefined {
        const latest = this.getSnapshots(applicationName)[0];

        this.log.info(
            {
                applicationName,
                found: Boolean(latest),
                snapshotId: latest?.id
            },
            "Latest snapshot loaded"
        );

        return latest;
    }

    deleteSnapshot(snapshotId: string): boolean {
        const existing = this.byId.get(snapshotId);
        if (!existing) {
            this.log.warn(
                {
                    snapshotId,
                    deleted: false
                },
                "Snapshot delete skipped"
            );
            return false;
        }

        this.byId.delete(snapshotId);
        this.snapshots = this.snapshots.filter(item => item.id !== snapshotId);

        this.log.info(
            {
                snapshotId,
                applicationName: existing.applicationName,
                deleted: true,
                remainingCount: this.snapshots.length
            },
            "Snapshot deleted"
        );

        return true;
    }

    clear(): void {
        const deletedCount = this.snapshots.length;
        this.snapshots = [];
        this.byId.clear();

        this.log.info(
            {
                deletedCount
            },
            "All snapshots cleared"
        );
    }

    getSnapshotCount(): number {
        return this.snapshots.length;
    }

    private cloneSnapshot(snapshot: Snapshot): Snapshot {
        return {
            ...snapshot,
            createdAt: new Date(snapshot.createdAt),
            pages: snapshot.pages.map(page => ({
                ...page,
                components: [...page.components],
                locators: [...page.locators],
                relationships: [...page.relationships],
                navigationTargets: [...page.navigationTargets]
            }))
        };
    }
}

export const snapshotRepository: SnapshotRepository = new InMemorySnapshotRepository();
