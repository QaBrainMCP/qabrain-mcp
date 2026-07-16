import { describe, expect, it } from "vitest";
import { PageKnowledge } from "../models/page-knowledge.model.js";
import { KnowledgeRepository } from "../repository/knowledge.repository.js";
import { RelationshipService } from "./relationship.service.js";

function page(id: string, url: string): PageKnowledge {
    const now = new Date();
    return {
        id, title: id, url, buttons: [], links: [], inputs: [], dropdowns: [], forms: [], tables: [],
        dialogs: [], navigationTargets: [], locators: [], visitedCount: 1, createdAt: now, updatedAt: now
    };
}

describe("RelationshipService", () => {
    it("stores a navigation relationship between different pages", () => {
        const repository = new KnowledgeRepository();
        const relationship = new RelationshipService(repository).learnNavigation(
            page("login", "/login"), page("dashboard", "/dashboard")
        );

        expect(relationship?.type).toBe("NAVIGATION");
        expect(repository.getRelationships()).toHaveLength(1);
    });
});
