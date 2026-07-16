import { describe, expect, it } from "vitest";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { QueryRepository } from "../repository/query.repository.js";
import { QueryEngineService } from "./query-engine.service.js";

function page(title: string): PageKnowledge {
    const now = new Date();
    return {
        id: title, title, url: `/${title.toLowerCase().replaceAll(" ", "-")}`,
        buttons: [{ type: "button", name: "Login", selector: "button" }], links: [], inputs: [],
        dropdowns: [], forms: [], tables: [], dialogs: [], navigationTargets: [], locators: [],
        visitedCount: 1, createdAt: now, updatedAt: now
    };
}

describe("QueryEngineService", () => {
    it("answers which pages contain a Login button", () => {
        knowledgeRepository.clear();
        knowledgeRepository.savePage(page("Login"));
        knowledgeRepository.savePage(page("Admin Login"));
        knowledgeRepository.savePage(page("Mobile Login"));

        const result = new QueryEngineService(new QueryRepository()).ask("Which pages contain Login button?");

        expect(result.results).toEqual(["Admin Login", "Login", "Mobile Login"]);
        expect(result.answer).toBe("Pages: Admin Login, Login, Mobile Login");
        expect(result.confidence).toBe(97);
    });
});
