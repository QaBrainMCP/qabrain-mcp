import { Page } from "playwright";
import { randomUUID } from "crypto";

export interface UIElement {
    id: string;
    type: string;
    tag: string;
    text: string;
    locator: string;
    visible: boolean;
    enabled: boolean;
    attributes: Record<string, string>;
}

export class DomExtractor {

    public async extract(page: Page): Promise<UIElement[]> {

        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        const rawElements = await page.evaluate(() => {

            const selectors = [
                "button",
                "a",
                "input",
                "textarea",
                "select",
                "form",
                "table",
                "dialog",
                "[role='button']",
                "[role='textbox']",
                "[role='link']",
                "[role='menuitem']",
                "[role='combobox']",
                "[role='dialog']"
            ];

            const elements: any[] = [];

            selectors.forEach(selector => {

                document.querySelectorAll(selector).forEach(element => {

                    const html = element as HTMLElement;

                    const attributes: Record<string, string> = {};

                    Array.from(element.attributes).forEach(attribute => {
                        attributes[attribute.name] = attribute.value;
                    });

                    elements.push({

                        tag: element.tagName.toLowerCase(),

                        text:
                            html.innerText?.trim() ||
                            element.getAttribute("aria-label") ||
                            element.getAttribute("placeholder") ||
                            "",

                        visible:
                            !!(
                                html.offsetWidth ||
                                html.offsetHeight ||
                                html.getClientRects().length
                            ),

                        enabled:
                            !(element as HTMLInputElement).disabled,

                        attributes

                    });

                });

            });

            return elements;

        });

        return rawElements.map(element => ({

            id: randomUUID(),

            type: this.getType(
                element.tag,
                element.attributes.role
            ),

            tag: element.tag,

            text: element.text,

            locator: this.generateLocator(element),

            visible: element.visible,

            enabled: element.enabled,

            attributes: element.attributes

        }));

    }

    private getType(tag: string, role?: string): string {

        if (role) return role;

        switch (tag) {

            case "button":
                return "button";

            case "a":
                return "link";

            case "input":
                return "input";

            case "textarea":
                return "textarea";

            case "select":
                return "dropdown";

            case "form":
                return "form";

            case "table":
                return "table";

            case "dialog":
                return "dialog";

            default:
                return tag;
        }

    }

    private generateLocator(element: any): string {

        const attr = element.attributes;

        if (attr["data-testid"])
            return `page.getByTestId("${attr["data-testid"]}")`;

        if (attr["aria-label"])
            return `page.getByLabel("${attr["aria-label"]}")`;

        if (attr.placeholder)
            return `page.getByPlaceholder("${attr.placeholder}")`;

        if (attr.id)
            return `page.locator("#${attr.id}")`;

        if (element.text)
            return `page.getByText("${element.text}")`;

        return `page.locator("${element.tag}")`;

    }

}