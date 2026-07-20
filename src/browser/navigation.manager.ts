import { pageManager } from "./page.manager.js";

const NAVIGATION_TIMEOUT_MS = 60_000;

export class NavigationManager {

    async open(url: string): Promise<void> {

        const page = await pageManager.getPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: NAVIGATION_TIMEOUT_MS
        });

        await page.locator("body").first().waitFor({
            state: "visible",
            timeout: NAVIGATION_TIMEOUT_MS
        });

    }

    async refresh(): Promise<void> {

        const page = await pageManager.getPage();

        await page.reload();

    }

    async back(): Promise<void> {

        const page = await pageManager.getPage();

        await page.goBack();

    }

    async forward(): Promise<void> {

        const page = await pageManager.getPage();

        await page.goForward();

    }

}

export const navigationManager = new NavigationManager();