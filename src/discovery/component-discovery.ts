import { Page } from "playwright";
import { ComponentKnowledge } from "./types.js";
import { randomUUID } from "node:crypto";

export class ComponentDiscovery {
    async discover(page: Page): Promise<ComponentKnowledge[]> {
        // Minimal discovery: find buttons and inputs
        const comps: ComponentKnowledge[] = [];
        const buttons = await page.$$("button");
        for (const b of buttons) {
            const text = (await b.innerText().catch(() => "")).trim();
            comps.push({ id: randomUUID(), name: text || "button", type: "button", visible: true, enabled: true, parentPage: page.url(), confidence: 80, selectors: [] });
        }
        return comps;
    }
}

export const componentDiscovery = new ComponentDiscovery();
