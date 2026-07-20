import { Locator, Page } from "playwright";

import { logger } from "../../utils/logger.js";
import { ExecutionStep } from "../models/execution-step.model.js";
import { PageState, PageStatePreparation } from "../models/page-state.model.js";

const READY_TIMEOUT_MS = 10_000;

const SIDEBAR_MENU_TARGETS = new Set([
    "admin",
    "pim",
    "leave",
    "time",
    "recruitment",
    "my info",
    "performance",
    "directory",
    "maintenance",
    "claim",
    "buzz"
]);

export class PageStateAnalyzerService {
    async analyze(page: Page): Promise<PageState> {
        const title = await page.title();
        const url = page.url();
        const currentPage = this.pageName(title, url);

        const navigation = await this.navigationState(page);
        const visibleDialogs = await this.visibleCount(page, [
            "dialog:visible",
            "[role='dialog']:visible",
            ".oxd-dialog-container:visible"
        ]);
        const visibleOverlays = await this.visibleCount(page, [
            ".oxd-overlay:visible",
            ".modal:visible",
            ".overlay:visible",
            "[data-overlay='true']:visible"
        ]);
        const visibleLoaders = await this.visibleCount(page, [
            ".oxd-loading-spinner:visible",
            ".spinner:visible",
            ".loader:visible",
            "[aria-busy='true']:visible"
        ]);

        const readyForInteraction = await this.isReady(page, visibleOverlays, visibleLoaders);

        return {
            currentPage,
            title,
            url,
            isAuthenticated: this.detectAuthenticated(url, navigation.isVisible),
            navigation,
            visibleDialogs,
            visibleOverlays,
            visibleLoaders,
            readyForInteraction,
            capturedAt: new Date().toISOString()
        };
    }

    async prepareForStep(page: Page, step: ExecutionStep): Promise<PageStatePreparation> {
        const initialState = await this.analyze(page);
        const adjustments: string[] = [];

        if (initialState.visibleOverlays > 0 || initialState.visibleDialogs > 0) {
            await page.keyboard.press("Escape").catch(() => undefined);
            adjustments.push("Dismissed visible dialog/overlay with Escape.");
        }

        if (this.requiresSidebarTarget(step) && initialState.navigation.isVisible && initialState.navigation.isCollapsed) {
            const expanded = await this.expandSidebar(page);
            if (expanded) {
                adjustments.push("Expanded collapsed navigation sidebar.");
            }
        }

        const finalState = await this.analyze(page);

        logger.info(
            {
                step: step.order,
                currentPage: initialState.currentPage,
                applicationState: {
                    authenticated: initialState.isAuthenticated,
                    navigationCollapsed: initialState.navigation.isCollapsed,
                    dialogs: initialState.visibleDialogs,
                    overlays: initialState.visibleOverlays,
                    loaders: initialState.visibleLoaders,
                    readyForInteraction: initialState.readyForInteraction
                },
                uiAdjustmentsPerformed: adjustments,
                finalState: {
                    currentPage: finalState.currentPage,
                    authenticated: finalState.isAuthenticated,
                    navigationCollapsed: finalState.navigation.isCollapsed,
                    dialogs: finalState.visibleDialogs,
                    overlays: finalState.visibleOverlays,
                    loaders: finalState.visibleLoaders,
                    readyForInteraction: finalState.readyForInteraction
                }
            },
            "Page state analyzed before step execution"
        );

        return {
            initialState,
            finalState,
            adjustments
        };
    }

    private async navigationState(page: Page): Promise<{ isVisible: boolean; isCollapsed: boolean }> {
        const sidebar = page.locator("aside, nav.oxd-navbar-nav").first();
        const isVisible = await sidebar.count().then(count => count > 0).catch(() => false)
            && await sidebar.isVisible().catch(() => false);

        if (!isVisible) {
            return {
                isVisible: false,
                isCollapsed: false
            };
        }

        const isCollapsed = await page.evaluate(() => {
            const sidebar = document.querySelector("aside") as HTMLElement | null;
            if (!sidebar) {
                return false;
            }

            const className = sidebar.className.toLowerCase();
            const byClass = className.includes("collapse") || className.includes("collapsed") || className.includes("close");
            const byWidth = sidebar.getBoundingClientRect().width < 120;
            return byClass || byWidth;
        }).catch(() => false);

        return {
            isVisible: true,
            isCollapsed
        };
    }

    private detectAuthenticated(url: string, navigationVisible: boolean): boolean {
        const normalizedUrl = url.toLowerCase();
        if (normalizedUrl.includes("/auth/login")) {
            return false;
        }
        if (normalizedUrl.includes("/dashboard")) {
            return true;
        }
        return navigationVisible;
    }

    private async isReady(page: Page, overlays: number, loaders: number): Promise<boolean> {
        try {
            await page.locator("body").first().waitFor({
                state: "visible",
                timeout: READY_TIMEOUT_MS
            });
            return overlays === 0 && loaders === 0;
        } catch {
            return false;
        }
    }

    private pageName(title: string, url: string): string {
        if (title.trim()) {
            return title.trim();
        }
        try {
            const parsed = new URL(url);
            return parsed.pathname || url;
        } catch {
            return url;
        }
    }

    private async visibleCount(page: Page, selectors: string[]): Promise<number> {
        let count = 0;
        for (const selector of selectors) {
            count += await page.locator(selector).count().catch(() => 0);
        }
        return count;
    }

    private requiresSidebarTarget(step: ExecutionStep): boolean {
        const target = step.target?.trim().toLowerCase();
        return Boolean(target && SIDEBAR_MENU_TARGETS.has(target));
    }

    private async expandSidebar(page: Page): Promise<boolean> {
        const candidates: Locator[] = [
            page.locator(".oxd-topbar-header-hamburger").first(),
            page.locator("button[aria-label*='menu' i]").first(),
            page.locator(".oxd-main-menu-search button").first()
        ];

        for (const candidate of candidates) {
            try {
                if (await candidate.count() === 0) {
                    continue;
                }
                if (!await candidate.isVisible()) {
                    continue;
                }
                await candidate.click();
                await page.waitForTimeout(250);
                return true;
            } catch {
                continue;
            }
        }

        return false;
    }
}

export const pageStateAnalyzerService = new PageStateAnalyzerService();
