import { beforeEach, describe, expect, it } from "vitest";
import { applicationMapService } from "../../application/services/application-map.service.js";
import { mapRequirement } from "../tools/map-requirement.tool.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { mappingRepository } from "../repository/mapping.repository.js";

describe("RequirementMappingService", () => {
    beforeEach(() => {
        applicationMapService.create("Playwright");
        applicationMapService.addPage({ id: "login", title: "Login", url: "/login" });
        applicationMapService.addPage({ id: "dashboard", title: "Dashboard", url: "/dashboard" });
        workflowMemory.clear();
        workflowMemory.remember({
            id: "login-workflow",
            name: "Login → Dashboard",
            application: "Playwright",
            pages: ["Login", "Dashboard"],
            actions: ["Open Login", "Submit Login"],
            locators: ["Username", "Password", "Login Button"],
            createdAt: new Date()
        });
        mappingRepository.clear();
    });

    it("maps a parsed requirement to existing application knowledge", async () => {
        const mapping = await mapRequirement({
            feature: `Scenario: Valid Login
Given User opens Login page
When User enters Username
And User enters Password
And User clicks Login
Then Dashboard should be displayed`
        });

        expect(mapping).toEqual({
            application: "Playwright",
            pages: ["Login", "Dashboard"],
            elements: ["Username", "Password", "Login Button"],
            workflow: "Login → Dashboard",
            knownLocators: ["Username", "Password", "Login Button"],
            confidence: 95
        });
        expect(mappingRepository.getAll()).toEqual([mapping]);
    });
});
