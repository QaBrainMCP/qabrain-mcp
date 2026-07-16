import { applicationMapService, ApplicationMapService } from "../../application/services/application-map.service.js";
import { Component } from "../../knowledge/models/component.model.js";
import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";

export interface PageImpactResult {
    pages: string[];
    components: Component[];
}

export class PageImpactService {
    constructor(
        private readonly knowledge: KnowledgeRepository = knowledgeRepository,
        private readonly applicationMap: ApplicationMapService = applicationMapService
    ) {}

    find(changed: string): PageImpactResult {
        const directPages = this.knowledge.getPages().filter(page =>
            this.matches(changed, page.title) || this.pageContains(page, changed)
        );
        const directIds = new Set(directPages.map(page => page.id));
        const relatedIds = this.knowledge.getRelationships().flatMap(relationship =>
            directIds.has(relationship.sourcePageId) || directIds.has(relationship.targetPageId)
                ? [relationship.sourcePageId, relationship.targetPageId]
                : []
        );
        const pages = this.knowledge.getPages().filter(page =>
            directIds.has(page.id) || relatedIds.includes(page.id)
        );
        const mappedPages = this.applicationMap.getMap().pages
            .filter(page => this.matches(changed, page.title))
            .map(page => page.title);

        return {
            pages: this.unique([...pages.map(page => page.title), ...mappedPages]),
            components: pages.flatMap(page => this.components(page))
        };
    }

    private pageContains(page: ReturnType<KnowledgeRepository["getPages"]>[number], changed: string): boolean {
        return this.components(page).some(component => this.matches(changed, component.name)) ||
            page.locators.some(locator => this.matches(changed, locator));
    }

    private components(page: ReturnType<KnowledgeRepository["getPages"]>[number]): Component[] {
        return [
            ...page.buttons, ...page.links, ...page.inputs, ...page.dropdowns,
            ...page.forms, ...page.tables, ...page.dialogs
        ];
    }

    private matches(changed: string, candidate: string): boolean {
        const normalize = (value: string) => value.toLowerCase().replace(/\s+button$/, "");
        const expected = normalize(changed);
        const actual = normalize(candidate);
        return actual.includes(expected) || expected.includes(actual);
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }
}
