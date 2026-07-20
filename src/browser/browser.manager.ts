import { chromium, Browser, BrowserContext, Page } from "playwright";
import { logger } from "../utils/logger.js";

const DEFAULT_NAVIGATION_TIMEOUT_MS = 60_000;

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private launchPromise: Promise<Browser> | null = null;
    private pagePromise: Promise<Page> | null = null;

    async launch(): Promise<Browser> {
        if (this.browser) {
            logger.debug("Browser already launched; reusing instance");
            return this.browser;
        }

        if (!this.launchPromise) {
            this.launchPromise = (async () => {
                logger.info("Launching Browser...");
                this.browser = await chromium.launch({ headless: false });
                logger.info("Browser launch completed");
                return this.browser;
            })().finally(() => {
                this.launchPromise = null;
            });
        }

        return this.launchPromise;
    }

    async ensurePage(): Promise<Page> {
        if (this.page) {
            return this.page;
        }

        if (!this.pagePromise) {
            this.pagePromise = (async () => {
                const browser = await this.launch();
                if (!this.context) {
                    logger.info("Creating browser context");
                    this.context = await browser.newContext();
                    logger.info("Browser context created");
                }
                if (!this.page) {
                    logger.info("Creating new browser page");
                    this.page = await this.context.newPage();
                    this.page.setDefaultNavigationTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);
                    this.page.setDefaultTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);
                    logger.info(
                        { navigationTimeoutMs: DEFAULT_NAVIGATION_TIMEOUT_MS },
                        "New page created with default timeouts"
                    );
                }
                return this.page;
            })().finally(() => {
                this.pagePromise = null;
            });
        }

        return this.pagePromise;
    }

    getPage(): Page | null {
        return this.page;
    }

    async getTitle() {
        const page = this.page ?? await this.ensurePage();
        return page.title();
    }

    getUrl() {
        return this.page?.url() ?? "";
    }

    async closePage() {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }

        if (this.context) {
            await this.context.close();
            this.context = null;
        }
    }

    async close() {
        await this.closePage();
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            logger.info("Browser Closed");
        }
    }

    async open(url: string) {
        const page = await this.ensurePage();
        logger.info({ url }, "Page navigation started");
        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: DEFAULT_NAVIGATION_TIMEOUT_MS
        });
        await page.locator("body").first().waitFor({
            state: "visible",
            timeout: DEFAULT_NAVIGATION_TIMEOUT_MS
        });
        logger.info({ url }, "Page navigation completed");
    }

    async refresh() {
        await (await this.ensurePage()).reload();
    }

    async back() {
        await (await this.ensurePage()).goBack();
    }

    async forward() {
        await (await this.ensurePage()).goForward();
    }
}

export const browserManager = new BrowserManager();