import { Page } from "playwright";
import { LocatorKnowledge } from "./types.js";

export class LocatorDiscovery {
    async generate(page: Page, componentName: string): Promise<LocatorKnowledge[]> {
        // Very small heuristic: prefer text-based selectors
        const recommended = `:text("${componentName}")`;
        return [{ componentId: componentName, recommended, fallbacks: [], confidence: 70 } as LocatorKnowledge];
    }
}

export const locatorDiscovery = new LocatorDiscovery();
