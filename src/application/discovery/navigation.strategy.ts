import { Page } from "playwright";

export interface NavigationNode {
    id: string;
    name: string;
    locator: string;
    level: number;
}

export interface NavigationStrategy {
    discover(page: Page): Promise<NavigationNode[]>;
}