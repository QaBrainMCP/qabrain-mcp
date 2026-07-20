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

        try {
            logger.info({ application }, "Page acquisition started");
            const page = await this.getPage();
            logger.info({ application, url: page.url() }, "Page acquisition completed");

            const adapter = adapterRegistry.get(application);
            logger.info({ application: adapter.name }, "Application adapter resolved");

            logger.info({ application: adapter.name }, "Login started");
            await adapter.login(page);
            logger.info({ application: adapter.name, url: page.url() }, "Login completed");

            logger.info({ application: adapter.name }, "Verification started");
            const verified = await adapter.verify(page);
            logger.info({ application: adapter.name, verified }, "Verification completed");

            if (!verified) {
                throw new Error(`${adapter.name} login verification failed.`);
            }

            const previousPage = this.repository.getPages().at(-1);

            logger.info({ application }, "Application exploration started");
            await this.explorer.explore(page);
            logger.info({ application }, "Application exploration completed");

            logger.info({ application }, "Component discovery started");
            const components = await this.componentDiscovery.discover(page);
            logger.info(
                {
                    application,
                    counts: {
                        buttons: components.buttons.length,
                        links: components.links.length,
                        inputs: components.inputs.length,
                        dropdowns: components.dropdowns.length,
                        forms: components.forms.length,
                        tables: components.tables.length,
                        dialogs: components.dialogs.length
                    }
                },
                "Component discovery completed"
            );

            logger.info({ application }, "Locator discovery started");
            const locators = await this.discoverLocators(page, Object.values(components).flat());
            logger.info({ application, locatorCount: locators.length }, "Locator discovery completed");

            logger.info({ application }, "Knowledge persistence started");
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

            logger.info(
                { application, page: learnedPage.url, pageCount: knowledge.pages.length },
                "Knowledge saved"
            );
            logger.info({ application, page: learnedPage.url }, "Application knowledge learned");
            return knowledge;
        } catch (error) {
            logger.error({ err: error, application }, "Application knowledge learning failed");
            throw error;
        }
    }

    private async discoverLocators(page: Page, components: Component[]): Promise<string[]> {
        const results = await Promise.all(components.map(component => this.findLocator(page, component.name)));
        return results.filter((locator): locator is string => locator !== null);
    }

    private async findLocator(page: Page, name: string): Promise<string | null> {
        try {
            return (await this.locatorDiscovery.find(page, name))?.recommended ?? null;
        } catch (error: unknown) {
            logger.warn({ err: error, name }, "Unable to discover component locator");
            return null;
        }
    }
}

export const knowledgeEngineService = new KnowledgeEngineService();
