import { LocatorDiscoveryService } from "../../locator/services/locator.discovery.service.js";
import { Workflow } from "../../workflow/models/workflow.model.js";

export class LocatorMapperService {
    constructor(private readonly locatorDiscovery = new LocatorDiscoveryService()) {}

    map(elementNames: readonly string[], workflows: readonly Workflow[]): string[] {
        return this.locatorDiscovery.matchKnownLocators(
            elementNames,
            workflows.flatMap(workflow => workflow.locators)
        );
    }
}

export const locatorMapperService = new LocatorMapperService();
