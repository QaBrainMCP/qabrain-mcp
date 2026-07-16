import { browserManager } from "../browser/browser.manager.js";
import { openUrl } from "./open-url.tool.js";
import { LocatorDiscoveryService } from "../locator/services/locator.discovery.service.js";

const service = new LocatorDiscoveryService();

export async function findLocator(
    url: string,
    elementName: string
) {

    await openUrl(url);

    const page = await browserManager.ensurePage();

    const result = await service.find(page, elementName);

    return result;
}