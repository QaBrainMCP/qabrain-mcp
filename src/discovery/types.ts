import { Browser, BrowserContext, Page } from "playwright";

export interface LoginSession {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    cookies: any[];
    storageState: any;
}

export interface PageKnowledgeSummary {
    url: string;
    title: string;
    screenshotPath?: string;
    dom?: string;
}

export interface ComponentKnowledge {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    enabled: boolean;
    parentPage: string;
    confidence: number;
    selectors: string[];
}

export interface LocatorKnowledge {
    componentId: string;
    recommended: string;
    fallbacks: string[];
    confidence: number;
}

export interface WorkflowKnowledge {
    name: string;
    pages: string[];
    components: string[];
    confidence: number;
}

export interface SnapshotInfo {
    id: string;
    pageUrl: string;
    screenshot: string;
    domPath: string;
    accessibility?: any;
}

export interface DiscoveryResult {
    success: boolean;
    pages: PageKnowledgeSummary[];
    components: ComponentKnowledge[];
    locators: LocatorKnowledge[];
    workflows: WorkflowKnowledge[];
    snapshots: SnapshotInfo[];
    statistics: Record<string, number>;
}
