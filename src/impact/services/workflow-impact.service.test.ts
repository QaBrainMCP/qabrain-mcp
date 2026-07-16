import { describe, expect, it } from "vitest";
import { Workflow } from "../../workflow/models/workflow.model.js";
import { WorkflowImpactService } from "./workflow-impact.service.js";

describe("WorkflowImpactService", () => {
    it("finds workflows that use an affected page", () => {
        const workflows: Workflow[] = [{
            id: "login", name: "Login Flow", application: "Playwright", pages: ["Login", "Dashboard"],
            actions: ["Submit Login"], locators: ["Username"], createdAt: new Date()
        }];

        expect(new WorkflowImpactService().find("Login", ["Login"], workflows)).toEqual(["Login Flow"]);
    });
});
