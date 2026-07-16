import { Page } from "playwright";
import { DiscoveredComponents } from "./component-discovery.service.js";
import { PageKnowledge } from "../models/page-knowledge.model.js";

export class PageKnowledgeService {
    create(page: Page, components: DiscoveredComponents, locators: string[]): Promise<PageKnowledge> {
        const now = new Date();
        return page.title().then(title => ({
            id: crypto.randomUUID(),
            title,
            url: page.url(),
            ...components,
            navigationTargets: [],
            locators,
            visitedCount: 1,
            createdAt: now,
            updatedAt: now
        }));
    }
}

export const pageKnowledgeService = new PageKnowledgeService();
