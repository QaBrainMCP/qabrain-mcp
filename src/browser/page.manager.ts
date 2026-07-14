import { Page, BrowserContext } from "playwright";
import { browserManager } from "./browser.manager.js";
import { logger } from "../utils/logger.js";
import { workflowRecorder } from "../workflow/recorder/workflow.recorder.js";

export class PageManager {

    private page: Page | null = null;

    private context: BrowserContext | null = null;

    async getPage(): Promise<Page> {

        if (!this.page) {

            const browser = await browserManager.launch();

            this.context = await browser.newContext();

            this.page = await this.context.newPage();

            // Listen for page navigation
            workflowRecorder.attach(this.page);

            logger.info("New Page Created");

        }

        return this.page;

    }

    async closePage() {

        if (this.page) {

            await this.page.close();

            this.page = null;

            logger.info("Page Closed");

        }

        if (this.context) {

            await this.context.close();

            this.context = null;

            logger.info("Browser Context Closed");

        }

    }

}

export const pageManager = new PageManager();