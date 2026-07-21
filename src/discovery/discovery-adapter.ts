import { browserLauncher } from "./browser-launcher.js";
import { snapshotEngine } from "./snapshot-engine.js";
import { DiscoveryResult } from "./types.js";
import { adapterRegistry } from "../application/adapters/adapter.registry.js";
import { pageManager } from "../browser/page.manager.js";
import { knowledgeEngineService } from "../knowledge/services/knowledge-engine.service.js";

const STDERR = (msg: string) => { console.error(msg); };

export class DiscoveryAdapter {
    async learn(application: string): Promise<DiscoveryResult> {
        STDERR(`DiscoveryAdapter: starting learn for ${application}`);

        // Ensure browser is launched and a page exists
        try {
            await browserLauncher.launch();
        } catch (err) {
            STDERR(`DiscoveryAdapter: browser launch failed: ${String(err)}`);
            throw err;
        }

        // reuse existing page manager to get page
        const page = await pageManager.getPage();

        // use adapter for login
        const adapter = adapterRegistry.get(application);
        STDERR(`DiscoveryAdapter: using adapter ${adapter.name} to login`);
        await adapter.login(page);

        // delegate to existing knowledge engine for discovery/persistence
        const knowledge = await knowledgeEngineService.learn(application);

        // capture snapshot for current page
        const snap = await snapshotEngine.capture(page);

        const result: DiscoveryResult = {
            success: true,
            pages: knowledge.pages.map(p => ({ url: p.url, title: p.title })),
            components: [],
            locators: [],
            workflows: [],
            snapshots: [snap],
            statistics: { pages: knowledge.pages.length }
        };

        STDERR(`DiscoveryAdapter: completed learn for ${application}`);
        return result;
    }
}

export const discoveryAdapter = new DiscoveryAdapter();
