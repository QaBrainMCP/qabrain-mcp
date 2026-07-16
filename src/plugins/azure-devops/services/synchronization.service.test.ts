import { describe, expect, it } from "vitest";
import { GraphBuilderService } from "../../../knowledge-graph/services/graph-builder.service.js";
import { GraphRepository } from "../../../knowledge-graph/repository/graph.repository.js";
import { ProjectService } from "./project.service.js";
import { TestCaseService } from "./testcase.service.js";
import { WorkItemService } from "./workitem.service.js";
import { AzureRepository } from "../repository/azure.repository.js";
import { SynchronizationService } from "./synchronization.service.js";

describe("SynchronizationService", () => {
    it("imports enterprise artifacts and projects them into the knowledge graph", async () => {
        const repository = new AzureRepository();
        const projects = {
            importProjects: async () => repository.saveProjects([{ id: "p1", name: "QaBrain", description: null, url: "url", state: "wellFormed" }]),
            importRepositories: async () => repository.saveRepositories([{ id: "r1", name: "web", projectId: "p1", url: "url" }]),
            importIterations: async () => repository.saveIterations([]),
            importAreas: async () => repository.saveAreas([])
        } as unknown as ProjectService;
        const workItems = {
            importWorkItems: async () => repository.saveWorkItems([{ id: 1, title: "Login", type: "User Story", state: "New", url: "url", parentId: null }])
        } as unknown as WorkItemService;
        const testCases = {
            importTestPlans: async () => {
                repository.saveTestPlans([{ id: 1, name: "Regression", state: "Active" }]);
                repository.saveTestSuites([{ id: 2, name: "Login Suite", planId: 1 }]);
                repository.saveTestCases([{ id: 3, title: "Valid Login", state: "Active", url: "url" }]);
            },
            importTestResults: async () => repository.saveTestResults([])
        } as unknown as TestCaseService;
        const graphRepository = new GraphRepository();
        const service = new SynchronizationService(
            repository, projects, workItems, testCases,
            { build: () => ({ nodes: [], edges: [], builtAt: new Date() }) } as unknown as GraphBuilderService,
            graphRepository
        );

        const result = await service.synchronize("QaBrain");

        expect(result).toMatchObject({ projects: 1, repositories: 1, workItems: 1, testPlans: 1, testCases: 1 });
        expect(graphRepository.get().nodes.map(node => node.type)).toEqual(expect.arrayContaining([
            "Project", "Repository", "WorkItem", "TestPlan", "TestSuite", "TestCase"
        ]));
    });
});
