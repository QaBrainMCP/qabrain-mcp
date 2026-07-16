import { describe, expect, it } from "vitest";
import { QueryRepository } from "./query.repository.js";

describe("QueryRepository", () => {
    it("stores query results", () => {
        const repository = new QueryRepository();
        const result = {
            query: { question: "Show application knowledge", intent: "APPLICATION_KNOWLEDGE" as const, subject: null },
            answer: "Application knowledge: Login", results: ["Login"], confidence: 97
        };

        repository.save(result);

        expect(repository.getAll()).toEqual([result]);
    });
});
