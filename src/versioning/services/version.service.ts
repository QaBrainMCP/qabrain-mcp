import { RiskLevel } from "../../impact/models/impact.model.js";
import { KnowledgeChange } from "../models/change.model.js";
import { KnowledgeVersion } from "../models/version.model.js";
import { VersionRepository, versionRepository } from "../repository/version.repository.js";

export class VersionService {
    constructor(private readonly repository: VersionRepository = versionRepository) {}

    create(snapshotId: string, previousSnapshotId: string | null, changes: KnowledgeChange[], risk: RiskLevel, recommendations: string[]): KnowledgeVersion {
        const version: KnowledgeVersion = {
            version: this.nextVersion(),
            snapshotId,
            previousSnapshotId,
            changes,
            risk,
            recommendations,
            createdAt: new Date()
        };
        return this.repository.saveVersion(version);
    }

    private nextVersion(): string {
        const latest = this.repository.getVersions().at(-1)?.version;
        if (!latest) return "1.0.0";
        const [major, minor, patch] = latest.split(".").map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }
}

export const versionService = new VersionService();
