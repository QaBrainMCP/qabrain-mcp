import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { discoveryAdapter } from "../../src/discovery/discovery-adapter.js";
import * as browserLauncher from "../../src/discovery/browser-launcher.js";
import * as snapshotEngine from "../../src/discovery/snapshot-engine.js";
import { adapterRegistry } from "../../src/application/adapters/adapter.registry.js";
import { knowledgeEngineService } from "../../src/knowledge/services/knowledge-engine.service.js";

describe("DiscoveryAdapter", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("runs learn pipeline and returns summary", async () => {

        vi.spyOn(browserLauncher.browserLauncher, "launch").mockResolvedValue(undefined as any);

        vi.spyOn(adapterRegistry, "get").mockImplementation(() => ({ name: "stub", login: async () => {} } as any));

        vi.spyOn(knowledgeEngineService, "learn").mockResolvedValue({ application: "app", pages: [{ url: "http://x", title: "X" }], relationships: [] } as any);

        vi.spyOn(snapshotEngine.snapshotEngine, "capture").mockResolvedValue({ id: "s1", pageUrl: "http://x", screenshot: "p", domPath: "d" } as any);

        const res = await discoveryAdapter.learn("orangehrm");
        expect(res.success).toBe(true);
        expect(res.pages.length).toBe(1);
        expect(res.statistics.pages).toBe(1);
    });
});
