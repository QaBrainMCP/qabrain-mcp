import { describe, expect, it } from "vitest";
import { AzureClient } from "../client/azure.client.js";
import { AzureRepository } from "../repository/azure.repository.js";
import { ProjectService } from "./project.service.js";

describe("ProjectService", () => {
    it("maps imported projects and repositories into the connector repository", async () => {
        const client = {
            listProjects: async () => [{ id: "project-1", name: "QaBrain", description: "QA", url: "url", state: "wellFormed" }],
            listRepositories: async () => [{ id: "repo-1", name: "web", project: { id: "project-1" }, webUrl: "web-url", url: "url" }]
        } as unknown as AzureClient;
        const repository = new AzureRepository();
        const service = new ProjectService(client, repository);

        await service.importProjects();
        const repositories = await service.importRepositories("QaBrain");

        expect(repository.getProjects()[0].name).toBe("QaBrain");
        expect(repositories[0]).toMatchObject({ name: "web", projectId: "project-1" });
    });
});
