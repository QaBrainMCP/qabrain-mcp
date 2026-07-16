import { describe, expect, it } from "vitest";
import { AzureRepository } from "./azure.repository.js";

describe("AzureRepository", () => {
    it("stores imported Azure artifacts", () => {
        const repository = new AzureRepository();
        repository.saveProjects([{ id: "1", name: "QaBrain", description: null, url: "url", state: "wellFormed" }]);
        repository.saveWorkItems([{ id: 2, title: "Login", type: "User Story", state: "New", url: "url", parentId: null }]);

        expect(repository.getProjects()).toHaveLength(1);
        expect(repository.getWorkItems()[0].title).toBe("Login");
    });
});
