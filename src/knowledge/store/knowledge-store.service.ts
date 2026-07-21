import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import PageRecord from "./page-record.js";
import ComponentRecord from "./component-record.js";
import LocatorRecord from "./locator-record.js";
import NavigationRecord from "./navigation-record.js";
import { KnowledgeIndex } from "./knowledge-index.js";
import RepositoryMetadata from "./repository-metadata.js";
import { logger } from "../../utils/logger.js";

const ROOT = ".qabrain";

function ensureDir(dir: string) {
    return mkdir(dir, { recursive: true });
}

function filePath(name: string) {
    return path.join(ROOT, name);
}

function nowIso() {
    return new Date().toISOString();
}

export class KnowledgeStoreService {
    private applications: any[] = [];
    private pages: Record<string, PageRecord> = {};
    private components: Record<string, ComponentRecord> = {};
    private locators: Record<string, LocatorRecord> = {};
    private navigation: NavigationRecord[] = [];
    private metadata: RepositoryMetadata = { createdAt: nowIso(), lastOpenedAt: nowIso(), version: "1" };

    private loaded = false;

    async load(): Promise<void> {
        await ensureDir(ROOT);

        // load metadata
        try {
            const data = await readFile(filePath("metadata.json"), "utf8");
            this.metadata = JSON.parse(data);
        } catch {
            await this.saveMetadata();
        }

        // helper
        const loadJson = async <T>(name: string, fallback: T): Promise<T> => {
            try {
                const raw = await readFile(filePath(name), "utf8");
                return JSON.parse(raw) as T;
            } catch {
                await writeFile(filePath(name), JSON.stringify(fallback, null, 2), "utf8");
                return fallback;
            }
        };

        this.applications = await loadJson("applications.json", []);
        this.pages = await loadJson("pages.json", {});
        this.components = await loadJson("components.json", {});
        this.locators = await loadJson("locators.json", {});
        this.navigation = await loadJson("navigation.json", []);

        this.metadata.lastOpenedAt = nowIso();
        await this.saveMetadata();

        this.loaded = true;

        logger.info("Repository Loaded");
        logger.info({ pages: Object.keys(this.pages).length }, "Repository Pages");
        logger.info({ components: Object.keys(this.components).length }, "Repository Components");
        logger.info({ locators: Object.keys(this.locators).length }, "Repository Locators");
        logger.info({ snapshots: (await this.ensureSnapshots()).length }, "Repository Snapshots");
    }

    private async ensureSnapshots(): Promise<string[]> {
        const dir = filePath("snapshots");
        try {
            await access(dir);
        } catch {
            await ensureDir(dir);
        }
        // list files
        return [];
    }

    private async saveMetadata(): Promise<void> {
        await writeFile(filePath("metadata.json"), JSON.stringify(this.metadata, null, 2), "utf8");
    }

    // Pages
    getPage(pageId: string): PageRecord | undefined {
        return this.pages[pageId];
    }

    getPageByUrl(url: string): PageRecord | undefined {
        return Object.values(this.pages).find(p => url.includes(p.urlPattern) || p.urlPattern === url);
    }

    async savePage(page: PageRecord): Promise<void> {
        const existing = this.pages[page.pageId];
        if (existing) {
            const merged = { ...existing, ...page, lastUpdated: nowIso() };
            this.pages[page.pageId] = merged;
        } else {
            this.pages[page.pageId] = page;
        }
        await writeFile(filePath("pages.json"), JSON.stringify(this.pages, null, 2), "utf8");
        logger.info({ page: page.pageName }, "Repository Updated - Page");
    }

    // Components
    getComponent(componentId: string): ComponentRecord | undefined {
        return this.components[componentId];
    }

    searchComponents(q: string): ComponentRecord[] {
        const term = q.toLowerCase();
        return Object.values(this.components).filter(c =>
            (c.businessName ?? "").toLowerCase().includes(term) || (c.normalizedName ?? "").toLowerCase().includes(term)
        );
    }

    async saveComponent(component: ComponentRecord): Promise<void> {
        const existing = this.components[component.componentId];
        if (existing) {
            const merged: ComponentRecord = {
                ...existing,
                ...component,
                confidence: Math.max(existing.confidence ?? 0, component.confidence ?? 0),
                lastValidated: component.lastValidated ?? existing.lastValidated
            };
            this.components[component.componentId] = merged;
            logger.info("Components Updated");
        } else {
            this.components[component.componentId] = component;
            logger.info("Components Added");
        }
        await writeFile(filePath("components.json"), JSON.stringify(this.components, null, 2), "utf8");
    }

    // Locators
    getLocator(locatorId: string): LocatorRecord | undefined {
        return this.locators[locatorId];
    }

    getLocatorsForComponent(componentId: string): LocatorRecord[] {
        return Object.values(this.locators).filter(l => l.componentId === componentId);
    }

    async saveLocator(locator: LocatorRecord): Promise<void> {
        const existing = this.locators[locator.locatorId];
        if (existing) {
            const merged = {
                ...existing,
                ...locator,
                timesValidated: (existing.timesValidated ?? 0) + (locator.timesValidated ?? 0),
                lastValidated: locator.lastValidated ?? existing.lastValidated
            };
            this.locators[locator.locatorId] = merged;
            console.log("Locators Reused");
        } else {
            this.locators[locator.locatorId] = locator;
        }
        await writeFile(filePath("locators.json"), JSON.stringify(this.locators, null, 2), "utf8");
        logger.info({ locators: Object.keys(this.locators).length }, "Locators Persisted");
    }

    // Navigation
    getNavigation(): NavigationRecord[] {
        return [...this.navigation];
    }

    async saveNavigation(nav: NavigationRecord): Promise<void> {
        this.navigation.push(nav);
        await writeFile(filePath("navigation.json"), JSON.stringify(this.navigation, null, 2), "utf8");
    }

    // Search pages
    searchPages(q: string) {
        const term = q.toLowerCase();
        return Object.values(this.pages).filter(p => (p.pageName ?? "").toLowerCase().includes(term) || (p.title ?? "").toLowerCase().includes(term));
    }
}

export const knowledgeStoreService = new KnowledgeStoreService();
