import { Page } from "playwright";
import {
    NavigationNode,
    NavigationStrategy
} from "../discovery/navigation.strategy.js";

export class OrangeHRMNavigationStrategy
    implements NavigationStrategy {

    async discover(page: Page): Promise<NavigationNode[]> {

        const menu = page.locator("aside nav a");

        const count = await menu.count();

        const nodes: NavigationNode[] = [];

        for (let i = 0; i < count; i++) {

            const item = menu.nth(i);

            nodes.push({
                id: `menu-${i + 1}`,
                name: (await item.innerText()).trim(),
                locator: "aside nav a",
                level: 0
            });
        }

        return nodes;
    }
}

export const orangeHRMNavigationStrategy =
    new OrangeHRMNavigationStrategy();