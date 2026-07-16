import { describe, expect, it } from "vitest";
import { PageKnowledge } from "../models/page-knowledge.model.js";
import { KnowledgeRepository } from "./knowledge.repository.js";

function page(url: string): PageKnowledge {
    const now = new Date();
    return {
        id: crypto.randomUUID(), title: "Login", url,
        buttons: [], links: [], inputs: [], dropdowns: [], forms: [], tables: [], dialogs: [],
        navigationTargets: [], locators: [], visitedCount: 1, createdAt: now, updatedAt: now
    };
}

describe("KnowledgeRepository", () => {
    it("updates an existing page and increments its visit count", () => {
        const repository = new KnowledgeRepository();
        const first = repository.savePage(page("https://app.test/login"));
        const updated = repository.savePage(page("https://app.test/login"));

        expect(updated.id).toBe(first.id);
        expect(updated.visitedCount).toBe(2);
        expect(repository.getPages()).toEqual([updated]);
    });
});
