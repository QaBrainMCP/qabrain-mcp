import { Page } from "playwright";
import { knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { PageState, VisibleComponentsSummary } from "./page-state.js";

export class PageStateAnalyzerService {
    async analyze(page: Page): Promise<any> {
        const url = page.url();
        const title = await page.title().catch(() => "");
        const h1 = await this.firstHeading(page);
        const breadcrumbs = await this.collectBreadcrumbs(page);

        const detectedPage = this.detectCurrentPage(url, title, h1, breadcrumbs);

        const isLoggedIn = await this.detectAuthentication(page, url);
        const { sidebarVisible, sidebarExpanded, activeMenu } = await this.detectSidebarState(page);
        const { loading, spinnerVisible } = await this.detectLoading(page);
        const { modalOpen, dialogOpen } = await this.detectDialogs(page);
        const toastVisible = await this.detectToasts(page);
        const errorVisible = await this.detectErrors(page);

        const visible = await this.detectVisibleComponents(page);

        const viewport = page.viewportSize() ?? { width: 0, height: 0 };

        const pageReady = !loading && !modalOpen && !dialogOpen && !errorVisible;

        const focused = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null;
            if (!el) return null;
            return (el.getAttribute("id") || el.getAttribute("name") || el.tagName || el.textContent || null)?.toString().trim() ?? null;
        }).catch(() => null);

        const state: any = {
            pageName: detectedPage,
            url,
            title,
            isLoggedIn,
            pageReady,
            sidebarVisible,
            sidebarExpanded,
            modalOpen,
            dialogOpen,
            loading,
            spinnerVisible,
            toastVisible,
            errorVisible,
            activeMenu,
            breadcrumbs,
            visibleForms: visible.forms,
            visibleTables: visible.tables,
            visibleButtons: visible.buttons,
            visibleInputs: visible.inputs,
            visibleLinks: visible.links,
            visibleHeadings: visible.headings,
            focusedElement: focused,
            viewport: { width: viewport.width, height: viewport.height },
            timestamp: new Date().toISOString()
        };

        // Logging as requested
        console.log("-------------------------------------");
        console.log("Page State Analysis");
        console.log(`Current Page: ${state.pageName ?? "<unknown>"}`);
        console.log(`Authentication: ${state.isLoggedIn ? "Logged In" : "Logged Out"}`);
        console.log(`Sidebar: ${state.sidebarVisible ? (state.sidebarExpanded ? "Expanded" : "Collapsed") : "Hidden"}`);
        console.log(`Loading: ${state.loading ? "YES" : "NO"}`);
        console.log(`Dialog: ${state.dialogOpen ? "YES" : "NO"}`);
        console.log(`Active Menu: ${state.activeMenu ?? "<none>"}`);
        console.log(`Visible Buttons: ${state.visibleButtons}`);
        console.log(`Visible Inputs: ${state.visibleInputs}`);
        console.log(`Visible Tables: ${state.visibleTables}`);
        console.log(`Page Ready: ${state.pageReady ? "YES" : "NO"}`);
        console.log("-------------------------------------");

        return state;
    }

    private detectCurrentPage(url: string, title: string, h1: string | null, breadcrumbs: string[]): string | null {
        // Knowledge repository match by URL
        const repo = knowledgeRepository.getPageByUrl(url);
        if (repo) return repo.title ?? repo.url;

        // match by title
        const pages = knowledgeRepository.getPages();
        const titleMatch = pages.find(p => p.title && title && p.title.toLowerCase() === title.toLowerCase());
        if (titleMatch) return titleMatch.title;

        // match by h1 or breadcrumb
        if (h1) return h1;
        if (breadcrumbs.length > 0) return breadcrumbs[breadcrumbs.length - 1];

        // fallback to title or url
        return title || url;
    }

    private async detectAuthentication(page: Page, url: string): Promise<boolean> {
        const normalized = url.toLowerCase();
        if (normalized.includes("/auth/login") || normalized.includes("/login")) return false;
        // presence of sidebar or logout button
        const hasSidebar = await page.locator("aside, nav").count().then(c => c > 0).catch(() => false);
        const hasLogout = await page.getByRole("button", { name: /logout/i }).count().then(c => c > 0).catch(() => false);
        return hasSidebar || hasLogout;
    }

    private async detectSidebarState(page: Page): Promise<{ sidebarVisible: boolean; sidebarExpanded: boolean; activeMenu: string | null }> {
        const sidebar = page.locator("aside").first();
        const sidebarVisible = await sidebar.count().then(c => c > 0).catch(() => false) && await sidebar.isVisible().catch(() => false);
        let sidebarExpanded = false;
        let activeMenu: string | null = null;
        if (sidebarVisible) {
            sidebarExpanded = await page.evaluate(() => {
                const el = document.querySelector("aside") as HTMLElement | null;
                if (!el) return true;
                const cn = el.className.toLowerCase();
                const collapsed = cn.includes("collapse") || cn.includes("collapsed") || el.getBoundingClientRect().width < 120;
                return !collapsed;
            }).catch(() => true);
            const active = page.locator("aside .oxd-main-menu-item.active, aside [aria-current='page']").first();
            if (await active.count().catch(() => 0) > 0) {
                activeMenu = (await active.textContent())?.trim() ?? null;
            }
        }
        return { sidebarVisible, sidebarExpanded, activeMenu };
    }

    private async detectLoading(page: Page): Promise<{ loading: boolean; spinnerVisible: boolean }> {
        const spinner = await page.locator(".oxd-loading-spinner, .spinner, .loader, [aria-busy='true']").first();
        const spinnerVisible = await spinner.count().then(c => c > 0).catch(() => false) && await spinner.isVisible().catch(() => false);
        // detect progress bars or skeletons
        const progress = await page.locator("progress, .skeleton, .progress-bar").count().catch(() => 0);
        return { loading: spinnerVisible || progress > 0, spinnerVisible };
    }

    private async detectDialogs(page: Page): Promise<{ modalOpen: boolean; dialogOpen: boolean }> {
        const modal = await page.locator(".modal:visible, .oxd-dialog-container:visible").count().catch(() => 0);
        const dialog = await page.locator("dialog:visible, [role='dialog']:visible").count().catch(() => 0);
        return { modalOpen: modal > 0, dialogOpen: dialog > 0 };
    }

    private async detectToasts(page: Page): Promise<boolean> {
        const toast = await page.locator(".oxd-toast:visible, [role='status']:visible, .toast:visible").count().catch(() => 0);
        return toast > 0;
    }

    private async detectErrors(page: Page): Promise<boolean> {
        const err = await page.locator(".oxd-alert-content--error:visible, [role='alert']:visible, .error:visible").count().catch(() => 0);
        return err > 0;
    }

    private async detectVisibleComponents(page: Page): Promise<VisibleComponentsSummary> {
        const buttons = await page.locator("button,[role='button']").count().catch(() => 0);
        const inputs = await page.locator("input,textarea,[role='textbox']").count().catch(() => 0);
        const links = await page.locator("a,[role='link']").count().catch(() => 0);
        const dropdowns = await page.locator("select,[role='combobox']").count().catch(() => 0);
        const forms = await page.locator("form").count().catch(() => 0);
        const tables = await page.locator("table,[role='table']").count().catch(() => 0);
        const headings = await page.locator("h1,h2,h3,h4,h5,h6").count().catch(() => 0);

        return { buttons, inputs, links, dropdowns, forms, tables, headings };
    }

    private async firstHeading(page: Page): Promise<string | null> {
        const h = page.locator("h1,h2").first();
        if (await h.count().catch(() => 0) > 0) {
            return (await h.textContent())?.trim() ?? null;
        }
        return null;
    }

    private async collectBreadcrumbs(page: Page): Promise<string[]> {
        try {
            const items = page.locator("[aria-label*='breadcrumb'] li, [class*='breadcrumb'] li, nav[aria-label='breadcrumb'] li");
            const count = await items.count().catch(() => 0);
            const values: string[] = [];
            for (let i = 0; i < count; i++) {
                values.push((await items.nth(i).textContent())?.trim() ?? "");
            }
            return values.filter(Boolean);
        } catch {
            return [];
        }
    }
}

export const pageStateAnalyzerService = new PageStateAnalyzerService();
