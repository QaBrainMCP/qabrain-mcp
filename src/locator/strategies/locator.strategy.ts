import { Page } from "playwright";
import { LocatorResult } from "../models/locator.result.js";

export interface LocatorStrategy {

    find(
        page: Page,
        value: string
    ): Promise<LocatorResult | null>;

}