import { describe, expect, it } from "vitest";
import { ApplicationMapService } from "../../application/services/application-map.service.js";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { KnowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { WorkflowMemoryService } from "../../workflow/services/workflow.memory.service.js";
import { VersionRepository } from "../repository/version.repository.js";
import { SnapshotService } from "./snapshot.service.js";

describe("SnapshotService", () => {
    it("creates an immutable view of remembered pages and workflows", () => {
        const now = new Date();
        const knowledge = new KnowledgeRepository();
        const page: PageKnowledge = {
            id: "login", title: "Login", url: "/login",
            buttons: [{ type: "button", name: "Login", selector: "button" }], links: [], inputs: [],
            dropdowns: [], forms: [], tables: [], dialogs: [], navigationTargets: [], locators: ["Username"],
            visitedCount: 1, createdAt: now, updatedAt: now
        };
        knowledge.savePage(page);
        const workflows = new WorkflowMemoryService();
        workflows.remember({
            id: "login-flow", name: "Login Flow", application: "Playwright", pages: ["Login"],
            actions: ["Open"], locators: ["Username"], createdAt: now
        });
        const applicationMap = new ApplicationMapService();
        applicationMap.create("Playwright");

        const snapshot = new SnapshotService(new VersionRepository(), knowledge, workflows, applicationMap).create("Playwright");

        expect(snapshot.pages[0].components).toEqual(["Login Button"]);
        expect(snapshot.pages[0].locators).toEqual(["Username"]);
        expect(snapshot.workflows[0].name).toBe("Login Flow");
    });
});
