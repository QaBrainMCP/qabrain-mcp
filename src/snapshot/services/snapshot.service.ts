import { randomUUID } from "node:crypto";
import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { logger as defaultLogger } from "../../utils/logger.js";
import { Snapshot } from "../models/snapshot.model.js";
import { SnapshotPage } from "../models/snapshot-page.model.js";
import { SnapshotRepository, snapshotRepository } from "../repository/snapshot.repository.js";

interface SnapshotLogger {
    info: (obj: Record<string, unknown>, msg?: string) => void;
    warn: (obj: Record<string, unknown>, msg?: string) => void;
}

interface SnapshotServiceDependencies {
    knowledgeRepository?: Pick<KnowledgeRepository, "getPages" | "getRelationships">;
    snapshotRepository?: SnapshotRepository;
    logger?: SnapshotLogger;
    idGenerator?: () => string;
    now?: () => Date;
}

export interface SerializableSnapshotPage {
    id: string;
    title: string;
    url: string;
    components: string[];
    locators: string[];
    relationships: string[];
    navigationTargets: string[];
}

export interface SerializableSnapshot {
    id: string;
    applicationName: string;
    snapshotName: string;
    version: string;
    createdAt: string;
    pages: SerializableSnapshotPage[];
}

export class SnapshotService {
    private readonly knowledge: Pick<KnowledgeRepository, "getPages" | "getRelationships">;
    private readonly snapshots: SnapshotRepository;
    private readonly log: SnapshotLogger;
    private readonly generateId: () => string;
    private readonly now: () => Date;

    constructor(dependencies: SnapshotServiceDependencies = {}) {
        this.knowledge = dependencies.knowledgeRepository ?? knowledgeRepository;
        this.snapshots = dependencies.snapshotRepository ?? snapshotRepository;
        this.log = dependencies.logger ?? defaultLogger;
        this.generateId = dependencies.idGenerator ?? (() => randomUUID());
        this.now = dependencies.now ?? (() => new Date());
    }

    createSnapshot(applicationName: string): Snapshot {
        const createdAt = this.now();
        const latest = this.snapshots.getLatestSnapshot(applicationName);
        const version = this.nextVersion(latest?.version);
        const snapshotId = this.generateId();
        const snapshotName = `${applicationName}-${version}`;

        const pages = this.knowledge.getPages();
        const relationships = this.knowledge.getRelationships();

        const snapshotPages: SnapshotPage[] = pages.map(page => {
            const pageRelationships = relationships
                .filter(item => item.sourcePageId === page.id || item.targetPageId === page.id)
                .map(item => `${item.type}:${item.sourcePageId}->${item.targetPageId}`);

            return {
                id: page.id,
                title: page.title,
                url: page.url,
                components: this.collectComponents(page),
                locators: this.unique([
                    ...page.locators,
                    ...this.collectComponentLocators(page)
                ]),
                relationships: this.unique(pageRelationships),
                navigationTargets: this.unique(page.navigationTargets)
            };
        });

        const snapshot: Snapshot = {
            id: snapshotId,
            applicationName,
            snapshotName,
            version,
            createdAt,
            pages: snapshotPages
        };

        const saved = this.snapshots.saveSnapshot(snapshot);

        this.log.info(
            {
                snapshotId: saved.id,
                applicationName: saved.applicationName,
                version: saved.version,
                snapshotName: saved.snapshotName,
                pageCount: saved.pages.length
            },
            "Snapshot created"
        );

        return saved;
    }

    listSnapshots(applicationName: string): Snapshot[] {
        return this.snapshots.getSnapshots(applicationName);
    }

    loadSnapshot(snapshotId: string): Snapshot | undefined {
        const snapshot = this.snapshots.getSnapshot(snapshotId);

        this.log.info(
            {
                snapshotId,
                found: Boolean(snapshot)
            },
            "Snapshot loaded"
        );

        return snapshot;
    }

    getLatestSnapshot(applicationName: string): Snapshot | undefined {
        return this.snapshots.getLatestSnapshot(applicationName);
    }

    deleteSnapshot(snapshotId: string): boolean {
        const deleted = this.snapshots.deleteSnapshot(snapshotId);

        this.log.info(
            {
                snapshotId,
                deleted
            },
            "Snapshot deleted"
        );

        return deleted;
    }

    exportSnapshot(snapshotId: string): SerializableSnapshot {
        const snapshot = this.snapshots.getSnapshot(snapshotId);
        if (!snapshot) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }

        const exported: SerializableSnapshot = {
            id: snapshot.id,
            applicationName: snapshot.applicationName,
            snapshotName: snapshot.snapshotName,
            version: snapshot.version,
            createdAt: snapshot.createdAt.toISOString(),
            pages: snapshot.pages.map(page => ({
                id: page.id,
                title: page.title,
                url: page.url,
                components: [...page.components],
                locators: [...page.locators],
                relationships: [...page.relationships],
                navigationTargets: [...page.navigationTargets]
            }))
        };

        this.log.info(
            {
                snapshotId,
                applicationName: exported.applicationName,
                version: exported.version,
                pageCount: exported.pages.length
            },
            "Snapshot exported"
        );

        return exported;
    }

    importSnapshot(snapshot: unknown): Snapshot {
        const normalized = this.normalizeSnapshot(snapshot);
        this.validateSnapshot(normalized);

        const saved = this.snapshots.saveSnapshot(normalized);

        this.log.info(
            {
                snapshotId: saved.id,
                applicationName: saved.applicationName,
                version: saved.version,
                snapshotName: saved.snapshotName,
                pageCount: saved.pages.length
            },
            "Snapshot imported"
        );

        return saved;
    }

    private nextVersion(latestVersion?: string): string {
        if (!latestVersion) {
            return "1.0.0";
        }

        const [majorRaw, minorRaw, patchRaw] = latestVersion.split(".");
        const major = Number.parseInt(majorRaw ?? "1", 10);
        const minor = Number.parseInt(minorRaw ?? "0", 10);
        const patch = Number.parseInt(patchRaw ?? "0", 10);

        if (
            Number.isNaN(major) ||
            Number.isNaN(minor) ||
            Number.isNaN(patch)
        ) {
            return "1.0.0";
        }

        return `${major}.${minor}.${patch + 1}`;
    }

    private collectComponents(page: ReturnType<KnowledgeRepository["getPages"]>[number]): string[] {
        const components = [
            ...page.buttons,
            ...page.links,
            ...page.inputs,
            ...page.dropdowns,
            ...page.forms,
            ...page.tables,
            ...page.dialogs
        ];

        return this.unique(
            components.map(component => `${component.type}:${component.name}`)
        );
    }

    private collectComponentLocators(page: ReturnType<KnowledgeRepository["getPages"]>[number]): string[] {
        const components = [
            ...page.buttons,
            ...page.links,
            ...page.inputs,
            ...page.dropdowns,
            ...page.forms,
            ...page.tables,
            ...page.dialogs
        ];

        const locators = components.flatMap(component => {
            const candidateLocators = component.candidateLocators?.map(candidate => candidate.value) ?? [];
            const fallbackLocators = component.fallbackLocators?.map(candidate => candidate.value) ?? [];
            return [component.selector, ...candidateLocators, ...fallbackLocators];
        });

        return this.unique(locators.filter(Boolean));
    }

    private normalizeSnapshot(snapshot: unknown): Snapshot {
        if (!this.isObject(snapshot)) {
            throw new Error("Invalid snapshot payload: expected an object");
        }

        const pages = Array.isArray(snapshot.pages) ? snapshot.pages : [];

        return {
            id: this.asString(snapshot.id),
            applicationName: this.asString(snapshot.applicationName),
            snapshotName: this.asString(snapshot.snapshotName),
            version: this.asString(snapshot.version),
            createdAt: this.asDate(snapshot.createdAt),
            pages: pages.map(page => this.normalizeSnapshotPage(page))
        };
    }

    private normalizeSnapshotPage(page: unknown): SnapshotPage {
        if (!this.isObject(page)) {
            throw new Error("Invalid snapshot page payload: expected an object");
        }

        return {
            id: this.asString(page.id),
            title: this.asString(page.title),
            url: this.asString(page.url),
            components: this.asStringArray(page.components),
            locators: this.asStringArray(page.locators),
            relationships: this.asStringArray(page.relationships),
            navigationTargets: this.asStringArray(page.navigationTargets)
        };
    }

    private validateSnapshot(snapshot: Snapshot): void {
        const errors: string[] = [];

        if (!snapshot.id.trim()) errors.push("id is required");
        if (!snapshot.applicationName.trim()) errors.push("applicationName is required");
        if (!snapshot.snapshotName.trim()) errors.push("snapshotName is required");
        if (!snapshot.version.trim()) errors.push("version is required");
        if (Number.isNaN(snapshot.createdAt.getTime())) errors.push("createdAt must be a valid date");
        if (!Array.isArray(snapshot.pages) || snapshot.pages.length === 0) errors.push("pages are required");

        for (const [index, page] of snapshot.pages.entries()) {
            if (!page.id.trim()) errors.push(`pages[${index}].id is required`);
            if (!page.title.trim()) errors.push(`pages[${index}].title is required`);
            if (!page.url.trim()) errors.push(`pages[${index}].url is required`);
            if (!Array.isArray(page.components)) errors.push(`pages[${index}].components must be an array`);
            if (!Array.isArray(page.locators)) errors.push(`pages[${index}].locators must be an array`);
            if (!Array.isArray(page.relationships)) errors.push(`pages[${index}].relationships must be an array`);
            if (!Array.isArray(page.navigationTargets)) errors.push(`pages[${index}].navigationTargets must be an array`);
        }

        if (errors.length > 0) {
            throw new Error(`Invalid snapshot schema:\n- ${errors.join("\n- ")}`);
        }
    }

    private asString(value: unknown): string {
        return typeof value === "string" ? value : "";
    }

    private asDate(value: unknown): Date {
        if (value instanceof Date) {
            return new Date(value);
        }

        if (typeof value === "string" || typeof value === "number") {
            return new Date(value);
        }

        return new Date(NaN);
    }

    private asStringArray(value: unknown): string[] {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter((item): item is string => typeof item === "string");
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }
}

export const snapshotService = new SnapshotService();
