import { Page } from "playwright";
import { LocatorResult } from "../models/locator.result.js";
import { LocatorStrategy } from "./locator.strategy.js";

export class RoleStrategy implements LocatorStrategy {

    async find(
        page: Page,
        text: string
    ): Promise<LocatorResult | null> {

        const roles = [
            "button",
            "link",
            "textbox",
            "checkbox",
            "radio",
            "combobox"
        ];

        for (const role of roles) {

            const locator = page.getByRole(role as any, {
                name: text
            });

            if (await locator.count() > 0) {

                return {

                    element: text,

                    recommended:
                        `page.getByRole("${role}", { name: "${text}" })`,

                    alternatives: [
                        `page.getByText("${text}")`
                    ],

                    confidence: 98,

                    strategy: "ROLE"

                };

            }

        }

        return null;

    }

}