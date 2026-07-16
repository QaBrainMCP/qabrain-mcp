import { describe, expect, it } from "vitest";
import { WorkflowMemoryService } from "./workflow.memory.service.js";

describe("WorkflowMemoryService", () => {
    it("remembers workflows and can find them by name", () => {
        const service = new WorkflowMemoryService();
        const workflow = {
            id: "wf-1",
            name: "Login",
            application: "Playwright",
            pages: ["Login"],
            actions: ["Open Login"],
            locators: ["Username"],
            createdAt: new Date()
        };

        service.remember(workflow);

        expect(service.getAll()).toEqual([workflow]);
        expect(service.findByName("Login")).toEqual(workflow);
    });

    it("clears all remembered workflows", () => {
        const service = new WorkflowMemoryService();
        service.remember({
            id: "wf-1",
            name: "Login",
            application: "Playwright",
            pages: ["Login"],
            actions: ["Open Login"],
            locators: ["Username"],
            createdAt: new Date()
        });

        service.clear();

        expect(service.getAll()).toEqual([]);
        expect(service.findByName("Login")).toBeUndefined();
    });
});
