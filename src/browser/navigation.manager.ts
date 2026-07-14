import { pageManager } from "./page.manager.js";

export class NavigationManager {

    async open(url: string): Promise<void> {

        const page = await pageManager.getPage();

        await page.goto(url, {
            waitUntil: "networkidle"
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