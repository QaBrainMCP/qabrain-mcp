import { Page } from "playwright";
import { LocatorResult } from "../models/locator.result.js";
import { TextStrategy } from "../strategies/text.strategy.js";
import { RoleStrategy } from "../strategies/role.strategy.js";


export class LocatorDiscoveryService {

 private strategies = [

    new RoleStrategy(),

    new TextStrategy()

];

    async find(
        page: Page,
        value: string
    ): Promise<LocatorResult | null> {

        for (const strategy of this.strategies) {

            const result = await strategy.find(page, value);

            if (result)
                return result;

        }

        return null;

    }

    matchKnownLocators(
        elementNames: readonly string[],
        knownLocators: readonly string[]
    ): string[] {
        return knownLocators.filter(locator =>
            elementNames.some(element =>
                locator.toLowerCase().includes(element.toLowerCase())
            )
        );
    }

}
