import { NavigationStrategy } from "./navigation.strategy.js";
import { orangeHRMNavigationStrategy } from "../orangehrm/orangehrm-navigation.strategy.js";

class StrategyRegistry {

    private readonly strategies = new Map<string, NavigationStrategy>();

    constructor() {
        this.strategies.set(
            "orangehrm",
            orangeHRMNavigationStrategy
        );
    }

    get(application: string): NavigationStrategy {

        const strategy =
            this.strategies.get(application.toLowerCase());

        if (!strategy) {
            throw new Error(
                `Navigation strategy not found for ${application}`
            );
        }

        return strategy;
    }
}

export const strategyRegistry =
    new StrategyRegistry();