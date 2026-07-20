import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Page } from "playwright";

import { KnowledgeRepository, knowledgeRepository } from "../../../knowledge/repository/knowledge.repository.js";
import { SnapshotService } from "../../../snapshot/services/snapshot.service.js";
import { AccessibilityInfo } from "../models/accessibility-info.js";
import { DomInfo } from "../models/dom-info.js";
import { ExecutionContext, KnowledgeSummary } from "../models/execution-context.js";
import { ScreenshotInfo, ScreenshotPhase } from "../models/screenshot-info.js";
import { AIPageStateAnalyzerService, aiPageStateAnalyzerService } from "./page-state-analyzer.service.js";

interface ContextCollectorDependencies {
    knowledgeRepository?: KnowledgeRepository;
    snapshotService?: SnapshotService;
    pageStateAnalyzer?: AIPageStateAnalyzerService;
}

interface CollectContextInput {
    featureName: string;
    scenarioName: string;
    stepNumber: number;
    featureStep: string;
    previousStep: string | null;
    phase: ScreenshotPhase;
    page: Page;
}

export class ContextCollectorService {
    private readonly knowledgeRepository: KnowledgeRepository;
    private readonly snapshotService: SnapshotService;
    private readonly pageStateAnalyzer: AIPageStateAnalyzerService;

    constructor(dependencies: ContextCollectorDependencies = {}) {
        this.knowledgeRepository = dependencies.knowledgeRepository ?? knowledgeRepository;
        this.snapshotService = dependencies.snapshotService ?? new SnapshotService();
        this.pageStateAnalyzer = dependencies.pageStateAnalyzer ?? aiPageStateAnalyzerService;
    }

    async collect(input: CollectContextInput): Promise<ExecutionContext> {
        const pageTitle = await input.page.title();
        const currentUrl = input.page.url();
        const viewportSize = input.page.viewportSize() ?? { width: 0, height: 0 };
        const browser = input.page.context().browser()?.browserType().name() ?? "unknown";

        const screenshot = await this.captureScreenshot(
            input.page,
            input.featureName,
            input.scenarioName,
            input.stepNumber,
            input.phase
        );

        const pageState = await this.pageStateAnalyzer.analyze(input.page);
        const dom = await this.captureDom(input.page, pageTitle);
        const accessibility = await this.captureAccessibility(input.page);
        const knowledgeSummary = this.captureKnowledgeSummary(input.featureName, currentUrl);

        return {
            featureName: input.featureName,
            scenarioName: input.scenarioName,
            stepNumber: input.stepNumber,
            featureStep: input.featureStep,
            previousStep: input.previousStep,
            timestamp: new Date().toISOString(),
            browser,
            currentUrl,
            pageTitle,
            viewport: viewportSize,
            pageState,
            knowledgeSummary,
            dom,
            accessibility,
            beforeScreenshot: input.phase === "before" ? screenshot : null,
            afterScreenshot: input.phase === "after" ? screenshot : null
        };
    }

    private async captureScreenshot(
        page: Page,
        featureName: string,
        scenarioName: string,
        stepNumber: number,
        phase: ScreenshotPhase
    ): Promise<ScreenshotInfo> {
        const baseDir = path.join("test-results", "feature-learning", this.slug(featureName), this.slug(scenarioName));
        await mkdir(baseDir, { recursive: true });

        const stepLabel = String(stepNumber).padStart(2, "0");
        const filename = `step-${stepLabel}-${phase}.png`;
        const screenshotPath = path.join(baseDir, filename);

        await page.screenshot({ path: screenshotPath, fullPage: true });

        return {
            phase,
            path: screenshotPath,
            capturedAt: new Date().toISOString()
        };
    }

    private async captureDom(page: Page, title: string): Promise<DomInfo> {
        const domStats = await page.evaluate(() => {
            return {
                html: document.documentElement.outerHTML,
                bodyTextLength: document.body?.innerText?.length ?? 0,
                forms: document.querySelectorAll("form").length,
                buttons: document.querySelectorAll("button,[role='button']").length,
                links: document.querySelectorAll("a,[role='link']").length
            };
        });

        return {
            html: domStats.html,
            title,
            bodyTextLength: domStats.bodyTextLength,
            forms: domStats.forms,
            buttons: domStats.buttons,
            links: domStats.links
        };
    }

    private async captureAccessibility(page: Page): Promise<AccessibilityInfo> {
        const snapshot = await this.captureAccessibilitySnapshot(page);

        const nodes = this.flattenAccessibility(snapshot);
        const mainLandmarks = nodes
            .filter(node => ["main", "navigation", "banner", "contentinfo", "complementary"].includes(node.role))
            .map(node => node.name || node.role);
        const interactiveControls = nodes.filter(node =>
            ["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab"].includes(node.role)
        ).length;

        return {
            snapshot,
            mainLandmarks,
            interactiveControls,
            totalNodes: nodes.length
        };
    }

    private async captureAccessibilitySnapshot(page: Page): Promise<unknown> {
        const pageWithAccessibility = page as unknown as {
            accessibility?: {
                snapshot: (options?: { interestingOnly?: boolean }) => Promise<unknown>;
            };
        };

        if (pageWithAccessibility.accessibility?.snapshot) {
            return pageWithAccessibility.accessibility.snapshot({ interestingOnly: false });
        }

        return null;
    }

    private flattenAccessibility(snapshot: unknown): Array<{ role: string; name?: string }> {
        const nodes: Array<{ role: string; name?: string }> = [];

        const walk = (node: unknown): void => {
            if (!node || typeof node !== "object") {
                return;
            }
            const record = node as { role?: string; name?: string; children?: unknown[] };
            if (record.role) {
                nodes.push({ role: record.role, name: record.name });
            }
            for (const child of record.children ?? []) {
                walk(child);
            }
        };

        walk(snapshot);
        return nodes;
    }

    private captureKnowledgeSummary(featureName: string, currentUrl: string): KnowledgeSummary {
        const knownPage = Boolean(this.knowledgeRepository.getPageByUrl(currentUrl));
        const pages = this.knowledgeRepository.getPages();
        const knownComponents = pages.reduce((acc, page) => {
            return acc +
                page.buttons.length +
                page.links.length +
                page.inputs.length +
                page.dropdowns.length +
                page.forms.length +
                page.tables.length +
                page.dialogs.length;
        }, 0);
        const knownLocators = pages.reduce((acc, page) => acc + page.locators.length, 0);
        const snapshotVersion = this.snapshotService.getLatestSnapshot(featureName)?.version ?? null;

        return {
            knownPage,
            knownComponents,
            knownLocators,
            snapshotVersion
        };
    }

    private slug(value: string): string {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "item";
    }
}

export const contextCollectorService = new ContextCollectorService();
