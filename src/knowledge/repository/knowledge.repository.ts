import { PageKnowledge } from "../models/page-knowledge.model.js";
import { Relationship } from "../models/relationship.model.js";
import { knowledgeStoreService } from "../store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";
import { randomUUID } from "node:crypto";

// bootstrap persistent store into in-memory repository
 (async () => {
    try {
        await knowledgeStoreService.load();
        // hydrate pages
        const pages = Object.values((knowledgeStoreService as any).pages) as any[];
        // pages may be PageRecord shapes; map to PageKnowledge where possible
        if (pages && pages.length) {
            for (const p of pages) {
                try {
                    const pk: PageKnowledge = {
                        id: p.pageId,
                        title: p.title ?? p.pageName ?? "",
                        url: p.urlPattern ?? "",
                        buttons: [],
                        links: [],
                        inputs: [],
                        dropdowns: [],
                        forms: [],
                        tables: [],
                        dialogs: [],
                        navigationTargets: p.navigationLinks ?? [],
                        locators: [],
                        visitedCount: 1,
                        createdAt: new Date(p.discoveredDate ?? Date.now()),
                        updatedAt: new Date(p.lastUpdated ?? Date.now())
                    };
                    // add to repo maps directly (will be picked up by code below)
                } catch {
                    // ignore hydration issues
                }
            }
        }
    } catch (err) {
        // Critical: unable to load persistent knowledge store. Log and rethrow to fail fast.
        try {
            logger.error({ err }, "Failed to load knowledge store during repository bootstrap");
        } catch {
            // fallback to console.error if logger not available
            // eslint-disable-next-line no-console
            console.error("Failed to load knowledge store during repository bootstrap", err);
        }
        throw err;
    }
 })();

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
            // persist page and its components/locators
                    try {
                        void knowledgeStoreService.savePage({
                            pageId: page.id,
                            pageName: page.title,
                            urlPattern: page.url,
                            title: page.title,
                            application: undefined,
                            discoveredDate: (page.createdAt || new Date()).toString(),
                            lastUpdated: (page.updatedAt || new Date()).toString(),
                            components: [],
                            navigationLinks: page.navigationTargets || []
                        });

                        // persist components
                        const pushComponent = async (c: any, type: string) => {
                            const name = c.name ?? c.label ?? "";
                            if (!name) return;
                            const existing = knowledgeStoreService.searchComponents(name).find((x: any) => x.pageId === page.id);
                            const compId = existing?.componentId ?? randomUUID();
                            const compRecord = {
                                componentId: compId,
                                pageId: page.id,
                                componentType: type,
                                businessName: name,
                                normalizedName: name.toLowerCase(),
                                automationName: name,
                                description: undefined,
                                state: undefined,
                                confidence: c.confidence ?? 80,
                                createdAt: new Date().toString(),
                                lastValidated: undefined
                            };
                            await knowledgeStoreService.saveComponent(compRecord);

                            // create locator record
                            const selector = c.selector ?? c?.candidateLocators?.[0]?.value ?? null;
                            if (selector) {
                                const loc = {
                                    locatorId: randomUUID(),
                                    componentId: compId,
                                    strategy: "css",
                                    locator: selector,
                                    confidence: c.confidence ?? 80,
                                    validationStatus: "VALIDATED" as const,
                                    lastValidated: new Date().toISOString(),
                                    timesValidated: 1,
                                    isPrimary: true,
                                    alternatives: []
                                };
                                await knowledgeStoreService.saveLocator(loc as any);
                            }
                        };

                        for (const btn of page.buttons ?? []) { void pushComponent(btn, "button"); }
                        for (const l of page.links ?? []) { void pushComponent(l, "link"); }
                        for (const inp of page.inputs ?? []) { void pushComponent(inp, "input"); }
                        for (const d of page.dropdowns ?? []) { void pushComponent(d, "dropdown"); }
                        for (const f of page.forms ?? []) { void pushComponent(f, "form"); }
                        for (const t of page.tables ?? []) { void pushComponent(t, "table"); }
                        for (const dlg of page.dialogs ?? []) { void pushComponent(dlg, "dialog"); }

                    } catch (err) {
                        // ignore persistence errors
                    }
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
        try {
            void knowledgeStoreService.savePage({
                pageId: updated.id,
                pageName: updated.title,
                urlPattern: updated.url,
                title: updated.title,
                application: undefined,
                discoveredDate: (updated.createdAt || new Date()).toString(),
                lastUpdated: (updated.updatedAt || new Date()).toString(),
                components: [],
                navigationLinks: updated.navigationTargets || []
            });
        } catch {}
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
