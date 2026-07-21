import { Page } from "playwright";
import { PageKnowledgeSummary } from "./types.js";

export class PageDiscovery {
    async discover(page: Page): Promise<PageKnowledgeSummary> {
        const title = await page.title().catch(() => "");
        const url = page.url();
        return { url, title } as PageKnowledgeSummary;
    }
}

export const pageDiscovery = new PageDiscovery();
