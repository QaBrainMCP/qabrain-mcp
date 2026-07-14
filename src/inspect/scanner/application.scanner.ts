import { Page } from "playwright";

export interface ApplicationScanResult {
    title: string;
    url: string;
    links: number;
    forms: number;
    buttons: number;
    inputs: number;
}

export class ApplicationScanner {

    async scan(page: Page): Promise<ApplicationScanResult> {

        return {

            title: await page.title(),

            url: page.url(),

            links: await page.locator("a").count(),

            forms: await page.locator("form").count(),

            buttons: await page.locator("button").count(),

            inputs: await page.locator("input").count()

        };

    }

}