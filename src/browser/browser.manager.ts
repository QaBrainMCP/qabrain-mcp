import { chromium, Browser, BrowserContext, Page } from "playwright";
import { logger } from "../utils/logger.js";

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private launchPromise: Promise<Browser> | null = null;
    private pagePromise: Promise<Page> | null = null;

    async launch(): Promise<Browser> {
        if (this.browser) {
            return this.browser;
        }

        if (!this.launchPromise) {
            this.launchPromise = (async () => {
                logger.info("Launching Browser...");
                this.browser = await chromium.launch({ headless: false });
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
                    this.context = await browser.newContext();
                }
                if (!this.page) {
                    this.page = await this.context.newPage();
                    logger.info("New Page Created");
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
        await page.goto(url);
        logger.info(`Opened ${url}`);
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