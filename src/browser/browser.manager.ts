import { chromium, Browser, Page } from "playwright";
import { logger } from "../utils/logger.js";


export class BrowserManager {
    private browser: Browser | null = null;


    private page: Page | null = null;

async launch(): Promise<Browser> {

    if (!this.browser) {

        logger.info("Launching Browser...");

        this.browser = await chromium.launch({
            headless: false
        });

        const context = await this.browser.newContext();

        this.page = await context.newPage();

        logger.info("New Page Created");
    }

    return this.browser;
}
    getPage() {
        return this.page!;
    }

    async getTitle() {
        return await this.page!.title();
    }

    getUrl() {
        return this.page!.url();
    }

  


    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            logger.info("Browser Closed");
        }
    }
    async open(url: string) {

    const page = this.getPage();

    await page.goto(url);

    logger.info(`Opened ${url}`);

}

async refresh() {

    await this.getPage().reload();

}

async back() {

    await this.getPage().goBack();

}

async forward() {

    await this.getPage().goForward();

}
}

export const browserManager = new BrowserManager();