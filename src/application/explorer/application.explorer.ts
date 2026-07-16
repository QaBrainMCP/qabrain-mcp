import { Page } from "playwright";
import { logger } from "../../utils/logger.js";

export class ApplicationExplorer {

    async explore(page: Page) {

        const buttons = await page.locator("button").count();
        const links = await page.locator("a").count();
        const inputs = await page.locator("input").count();
        const forms = await page.locator("form").count();
        const tables = await page.locator("table").count();

        logger.info({
            title: await page.title(),
            url: page.url(),
            buttons,
            links,
            inputs,
            forms,
            tables
        }, "Application Snapshot");

    }

}

export const applicationExplorer = new ApplicationExplorer();