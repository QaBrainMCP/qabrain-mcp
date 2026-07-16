import { describe, expect, it } from "vitest";
import { ImpactEngineService } from "../../impact/services/impact-engine.service.js";
import { GraphBuilderService } from "../../knowledge-graph/services/graph-builder.service.js";
import { ApplicationSnapshot } from "../models/snapshot.model.js";
import { VersionRepository } from "../repository/version.repository.js";
import { DiffService } from "./diff.service.js";
import { IncrementalLearningService } from "./incremental-learning.service.js";
import { SnapshotService } from "./snapshot.service.js";
import { VersionService } from "./version.service.js";

describe("IncrementalLearningService", () => {
    it("creates a version and triggers impact analysis only for detected changes", () => {
        const repository = new VersionRepository();
        const snapshots: ApplicationSnapshot[] = [
            { id: "first", application: "Playwright", pages: [{ title: "Login", url: "/login", components: [], locators: [] }], workflows: [], createdAt: new Date() },
            { id: "second", application: "Playwright", pages: [{ title: "Login", url: "/login", components: ["Remember Me Checkbox"], locators: [] }], workflows: [], createdAt: new Date() }
        ];
        let index = 0;
        const service = new IncrementalLearningService(
            repository,
            { create: () => repository.saveSnapshot(snapshots[index++]) } as unknown as SnapshotService,
            new DiffService(),
            new VersionService(repository),
            { build: () => ({ nodes: [], edges: [], builtAt: new Date() }) } as unknown as GraphBuilderService,
            { analyze: () => ({ risk: "MEDIUM" }) } as unknown as ImpactEngineService
        );

        service.learn("Playwright");
        const result = service.learn("Playwright");

        expect(result.version).toBe("1.0.1");
        expect(result.risk).toBe("MEDIUM");
        expect(result.changes).toContainEqual({
            type: "NEW_COMPONENT", page: "Login", component: "Remember Me Checkbox"
        });
        expect(result.recommendation).toContain("Review Remember Me Checkbox workflow");
    });
});
