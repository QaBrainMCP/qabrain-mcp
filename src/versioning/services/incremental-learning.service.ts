import { ImpactEngineService, impactEngineService } from "../../impact/services/impact-engine.service.js";
import { GraphBuilderService, graphBuilderService } from "../../knowledge-graph/services/graph-builder.service.js";
import { logger } from "../../utils/logger.js";
import { RiskLevel } from "../../impact/models/impact.model.js";
import { KnowledgeChange } from "../models/change.model.js";
import { VersionRepository, versionRepository } from "../repository/version.repository.js";
import { DiffService, diffService } from "./diff.service.js";
import { SnapshotService, snapshotService } from "./snapshot.service.js";
import { VersionService, versionService } from "./version.service.js";

export interface IncrementalLearningResult {
    version: string;
    changes: KnowledgeChange[];
    risk: RiskLevel;
    recommendation: string[];
}

export class IncrementalLearningService {
    constructor(
        private readonly repository: VersionRepository = versionRepository,
        private readonly snapshots: SnapshotService = snapshotService,
        private readonly diff: DiffService = diffService,
        private readonly versions: VersionService = versionService,
        private readonly graphBuilder: GraphBuilderService = graphBuilderService,
        private readonly impactEngine: ImpactEngineService = impactEngineService
    ) {}

    learn(application: string): IncrementalLearningResult {
        logger.info({ application }, "Starting incremental application learning");
        const previous = this.repository.getLatestSnapshot(application);
        const snapshot = this.snapshots.create(application);
        const changes = previous ? this.diff.compare(previous, snapshot) : [];
        this.graphBuilder.build();
        const impactReports = this.impactReports(changes);
        const risk = this.risk(impactReports.map(report => report.risk), changes.length);
        const recommendations = this.recommendations(changes);
        const version = this.versions.create(snapshot.id, previous?.id ?? null, changes, risk, recommendations);
        const result = { version: version.version, changes, risk, recommendation: recommendations };
        logger.info({ version: result.version, changeCount: changes.length }, "Incremental learning completed");
        return result;
    }

    private impactReports(changes: readonly KnowledgeChange[]) {
        const targets = this.changeTargets(changes);
        return targets.map(target => this.impactEngine.analyze(target));
    }

    private risk(risks: readonly RiskLevel[], changeCount: number): RiskLevel {
        const rank: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        const highest = risks.reduce<RiskLevel>((result, risk) => rank[risk] > rank[result] ? risk : result, "LOW");
        if (highest !== "LOW") return highest;
        if (changeCount >= 5) return "HIGH";
        if (changeCount > 0) return "MEDIUM";
        return "LOW";
    }

    private recommendations(changes: readonly KnowledgeChange[]): string[] {
        const targets = this.changeTargets(changes);
        return targets.flatMap(target => [`Review ${target} workflow`, `Update ${target} coverage`]);
    }

    private changeTargets(changes: readonly KnowledgeChange[]): string[] {
        return [...new Set(changes.flatMap(change => [
            change.page,
            change.component,
            change.locator,
            change.workflow
        ]).filter((target): target is string => target !== undefined))];
    }
}

export const incrementalLearningService = new IncrementalLearningService();
