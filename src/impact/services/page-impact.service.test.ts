import { describe, expect, it } from "vitest";
import { applicationMapService } from "../../application/services/application-map.service.js";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { KnowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { PageImpactService } from "./page-impact.service.js";

describe("PageImpactService", () => {
    it("finds the page and its components for a changed component", () => {
        const now = new Date();
        const knowledge = new KnowledgeRepository();
        const page: PageKnowledge = {
            id: "login", title: "Login", url: "/login",
            buttons: [{ type: "button", name: "Login", selector: "button" }], links: [],
            inputs: [{ type: "input", name: "Username", selector: "input" }], dropdowns: [], forms: [],
            tables: [], dialogs: [], navigationTargets: [], locators: ["Username"], visitedCount: 1,
            createdAt: now, updatedAt: now
        };
        knowledge.savePage(page);
        applicationMapService.create("Playwright");

        const result = new PageImpactService(knowledge).find("Login Button");

        expect(result.pages).toEqual(["Login"]);
        expect(result.components.map(component => component.name)).toEqual(["Login", "Username"]);
    });
});
