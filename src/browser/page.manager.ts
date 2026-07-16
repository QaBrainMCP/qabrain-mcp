import { Page } from "playwright";
import { browserManager } from "./browser.manager.js";
import { logger } from "../utils/logger.js";
import { workflowRecorder } from "../workflow/recorder/workflow.recorder.js";

export class PageManager {
    private page: Page | null = null;

    async getPage(): Promise<Page> {
        if (!this.page) {
            this.page = await browserManager.ensurePage();
            workflowRecorder.attach(this.page);
            logger.info("Reusing browser page");
        }

        return this.page;
    }

    async closePage() {
        if (this.page) {
            await this.page.close();
            this.page = null;
            logger.info("Page Closed");
        }

        await browserManager.closePage();
    }
}

export const pageManager = new PageManager();