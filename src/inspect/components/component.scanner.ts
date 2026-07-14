import { Page } from "playwright";

export interface ComponentScanResult {
    buttons: string[];
    inputs: number;
    dropdowns: number;
}

export class ComponentScanner {

    async scan(page: Page): Promise<ComponentScanResult> {

        return {

            buttons: await page.locator("button").allTextContents(),

            inputs: await page.locator("input").count(),

            dropdowns: await page.locator("select").count()

        };

    }

}