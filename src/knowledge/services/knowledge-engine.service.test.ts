import { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { applicationMapService } from "../../application/services/application-map.service.js";
import { ComponentDiscoveryService, DiscoveredComponents } from "./component-discovery.service.js";
import { PageKnowledgeService } from "./page-knowledge.service.js";
import { KnowledgeEngineService } from "./knowledge-engine.service.js";
import { KnowledgeRepository } from "../repository/knowledge.repository.js";

const emptyComponents: DiscoveredComponents = {
    buttons: [], links: [], inputs: [], dropdowns: [], forms: [], tables: [], dialogs: []
};

describe("KnowledgeEngineService", () => {
    it("stores pages, records navigation, and updates the application map", async () => {
        const repository = new KnowledgeRepository();
        let currentPage = { url: () => "https://app.test/login" } as unknown as Page;
        const engine = new KnowledgeEngineService(
            repository,
            { discover: async () => emptyComponents } as unknown as ComponentDiscoveryService,
            {
                create: async (page: Page) => {
                    const now = new Date();
                    return {
                        id: crypto.randomUUID(), title: page.url().endsWith("login") ? "Login" : "Dashboard",
                        url: page.url(), ...emptyComponents, navigationTargets: [], locators: [],
                        visitedCount: 1, createdAt: now, updatedAt: now
                    };
                }
            } as unknown as PageKnowledgeService,
            { find: async () => null },
            { explore: async () => undefined } as unknown as import("../../application/explorer/application.explorer.js").ApplicationExplorer,
            async () => currentPage
        );

        applicationMapService.create("");
        await engine.learn("Playwright");
        currentPage = { url: () => "https://app.test/dashboard" } as unknown as Page;
        const knowledge = await engine.learn("Playwright");

        expect(knowledge.pages.map(page => page.title)).toEqual(["Login", "Dashboard"]);
        expect(knowledge.relationships).toHaveLength(1);
        expect(repository.getPages()[0].navigationTargets).toEqual(["https://app.test/dashboard"]);
        expect(applicationMapService.getMap().pages.map(page => page.title)).toEqual(["Login", "Dashboard"]);
    });
});
