import { PageKnowledge } from "../models/page-knowledge.model.js";
import { Relationship } from "../models/relationship.model.js";

export class KnowledgeRepository {
    private pages: PageKnowledge[] = [];
    private relationships: Relationship[] = [];
    private readonly pageById = new Map<string, PageKnowledge>();
    private readonly pageByUrl = new Map<string, PageKnowledge>();

    savePage(page: PageKnowledge): PageKnowledge {
        const existing = this.pageByUrl.get(page.url);
        if (!existing) {
            this.pages.push(page);
            this.pageById.set(page.id, page);
            this.pageByUrl.set(page.url, page);
            return page;
        }

        const updated: PageKnowledge = {
            ...page,
            id: existing.id,
            createdAt: existing.createdAt,
            visitedCount: existing.visitedCount + 1
        };
        const existingIndex = this.pages.findIndex(item => item.id === existing.id);
        if (existingIndex !== -1) {
            this.pages[existingIndex] = updated;
        }
        this.pageById.set(existing.id, updated);
        this.pageByUrl.set(page.url, updated);
        return updated;
    }

    getPages(): PageKnowledge[] {
        return [...this.pages];
    }

    getPageByUrl(url: string): PageKnowledge | undefined {
        return this.pageByUrl.get(url);
    }

    addNavigationTarget(sourcePageId: string, targetUrl: string): void {
        const source = this.pageById.get(sourcePageId);
        if (source && !source.navigationTargets.includes(targetUrl)) {
            source.navigationTargets.push(targetUrl);
            source.updatedAt = new Date();
        }
    }

    saveRelationship(relationship: Relationship): Relationship {
        const exists = this.relationships.some(item =>
            item.sourcePageId === relationship.sourcePageId &&
            item.targetPageId === relationship.targetPageId &&
            item.type === relationship.type
        );
        if (!exists) {
            this.relationships.push(relationship);
        }
        return relationship;
    }

    getRelationships(): Relationship[] {
        return [...this.relationships];
    }

    clear(): void {
        this.pages = [];
        this.relationships = [];
        this.pageById.clear();
        this.pageByUrl.clear();
    }
}

export const knowledgeRepository = new KnowledgeRepository();
