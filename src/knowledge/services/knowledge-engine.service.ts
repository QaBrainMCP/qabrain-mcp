import { Page } from "playwright";
import { applicationMapService } from "../../application/services/application-map.service.js";
import { ApplicationExplorer } from "../../application/explorer/application.explorer.js";
import { pageManager } from "../../browser/page.manager.js";
import { LocatorDiscoveryService } from "../../locator/services/locator.discovery.service.js";
import { LocatorResult } from "../../locator/models/locator.result.js";
import { logger } from "../../utils/logger.js";
import { Component } from "../models/component.model.js";
import { PageKnowledge } from "../models/page-knowledge.model.js";
import { Relationship } from "../models/relationship.model.js";
import { KnowledgeRepository, knowledgeRepository } from "../repository/knowledge.repository.js";
import { ComponentDiscoveryService, componentDiscoveryService } from "./component-discovery.service.js";
import { PageKnowledgeService, pageKnowledgeService } from "./page-knowledge.service.js";
import { RelationshipService } from "./relationship.service.js";
import { adapterRegistry } from "../../application/adapters/adapter.registry.js";

interface LocatorLookup {
    find(page: Page, value: string): Promise<LocatorResult | null>;
}

export interface ApplicationKnowledge {
    application: string;
    pages: PageKnowledge[];
    relationships: Relationship[];
}

export class KnowledgeEngineService {
    private readonly relationshipService: RelationshipService;

    constructor(
        private readonly repository: KnowledgeRepository = knowledgeRepository,
        private readonly componentDiscovery: ComponentDiscoveryService = componentDiscoveryService,
        private readonly pageKnowledge: PageKnowledgeService = pageKnowledgeService,
        private readonly locatorDiscovery: LocatorLookup = new LocatorDiscoveryService(),
        private readonly explorer: ApplicationExplorer = new ApplicationExplorer(),
        private readonly getPage: () => Promise<Page> = () => pageManager.getPage()
    ) {
        this.relationshipService = new RelationshipService(repository);
    }

    async learn(application: string): Promise<ApplicationKnowledge> {
        logger.info({ application }, "Starting application knowledge learning");
        const page = await this.getPage();
        const adapter = adapterRegistry.get(application);

logger.info(
    { application: adapter.name },
    "Using Application Adapter"
);

await adapter.login(page);

const verified = await adapter.verify(page);

if (!verified) {
    throw new Error(
        `${adapter.name} login verification failed.`
    );
}
        const previousPage = this.repository.getPages().at(-1);

        await this.explorer.explore(page);
        const components = await this.componentDiscovery.discover(page);
        const locators = await this.discoverLocators(page, Object.values(components).flat());
        const learnedPage = this.repository.savePage(await this.pageKnowledge.create(page, components, locators));
        const relationship = this.relationshipService.learnNavigation(previousPage, learnedPage);
        if (relationship && previousPage) {
            this.repository.addNavigationTarget(previousPage.id, learnedPage.url);
        }

        const applicationMap = applicationMapService.getMap();
        if (!applicationMap.applicationName) {
            applicationMapService.create(application);
        }
        applicationMapService.rememberCurrentPage(learnedPage.title, learnedPage.url);

        const knowledge = {
            application: applicationMapService.getMap().applicationName,
            pages: this.repository.getPages(),
            relationships: this.repository.getRelationships()
        };
        logger.info({ application, page: learnedPage.url }, "Application knowledge learned");
        return knowledge;
    }

    private async discoverLocators(page: Page, components: Component[]): Promise<string[]> {
        const results = await Promise.all(components.map(component => this.findLocator(page, component.name)));
        return results.filter((locator): locator is string => locator !== null);
    }

    private async findLocator(page: Page, name: string): Promise<string | null> {
        try {
            return (await this.locatorDiscovery.find(page, name))?.recommended ?? null;
        } catch (error: unknown) {
            logger.warn({ error, name }, "Unable to discover component locator");
            return null;
        }
    }
}

export const knowledgeEngineService = new KnowledgeEngineService();
