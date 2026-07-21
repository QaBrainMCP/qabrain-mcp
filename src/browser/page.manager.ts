import { Page } from "playwright";
import { browserManager } from "./browser.manager.js";
import { logger } from "../utils/logger.js";
import { workflowRecorder } from "../workflow/recorder/workflow.recorder.js";

export class PageManager {
    private page: Page | null = null;

    async getPage(): Promise<Page> {
        try {
            logger.info("PageManager.getPage started");
            if (!this.page) {
                this.page = await browserManager.ensurePage();
                workflowRecorder.attach(this.page);
                logger.info("PageManager attached workflow recorder to new page");
            } else {
                logger.debug("PageManager reusing existing page");
            }

            logger.info({ url: this.page.url() }, "PageManager.getPage completed");
            return this.page;
        } catch (error) {
            logger.error({ err: error }, "PageManager.getPage failed");
            throw error;
        }
    }

    async closePage() {
        try {
            if (this.page) {
                try {
                    await this.page.close();
                } catch (err) {
                    logger.warn({ err }, "Error while closing page");
                }
                this.page = null;
                logger.info("Page Closed");
            }
        } finally {
            try {
                await browserManager.closePage();
            } catch (err) {
                logger.warn({ err }, "Error while closing browser page/context");
                // attempt a deeper close
                try { await browserManager.close(); } catch (err2) { logger.error({ err2 }, "Error while closing browser"); }
            }
        }
    }
}

export const pageManager = new PageManager();