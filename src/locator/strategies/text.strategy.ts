import { Page } from "playwright";
import { LocatorResult } from "../models/locator.result.js";
import { LocatorStrategy } from "./locator.strategy.js";

export class TextStrategy implements LocatorStrategy {

    async find(
        page: Page,
        text: string
    ): Promise<LocatorResult | null> {

        const locator = page.getByText(text);

        if (await locator.count() === 0)
            return null;

        return {

            element: text,

            recommended: `page.getByText("${text}")`,

            alternatives: [
                `page.locator("text=${text}")`
            ],

            confidence: 80,

            strategy: "TEXT"

        };

    }

}