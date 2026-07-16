import { Page } from "playwright";
import { logger } from "../../utils/logger.js";

export interface NavigationItem {
    name: string;
    locator: string;
}

export class NavigationDiscoveryService {

    async discover(page: Page): Promise<NavigationItem[]> {

        logger.info("Discovering application navigation...");

        const items = await page.locator("aside a").evaluateAll(elements =>
            elements.map(element => ({
                name: element.textContent?.trim() ?? "",
                locator: ""
            }))
        );

        return items.filter(item => item.name.length > 0);
    }
}

export const navigationDiscoveryService =
    new NavigationDiscoveryService();