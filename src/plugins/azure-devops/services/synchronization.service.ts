import { GraphEdgeType } from "../../../knowledge-graph/models/graph-edge.model.js";
import { KnowledgeGraph } from "../../../knowledge-graph/models/graph.model.js";
import { GraphNode, GraphNodeType } from "../../../knowledge-graph/models/graph-node.model.js";
import { GraphBuilderService, graphBuilderService } from "../../../knowledge-graph/services/graph-builder.service.js";
import { GraphRelationshipService, graphRelationshipService } from "../../../knowledge-graph/services/graph-relationship.service.js";
import { graphRepository as knowledgeGraphRepository, GraphRepository } from "../../../knowledge-graph/repository/graph.repository.js";
import { logger } from "../../../utils/logger.js";
import { AzureRepository, azureRepository } from "../repository/azure.repository.js";
import { ProjectService, projectService } from "./project.service.js";
import { TestCaseService, testCaseService } from "./testcase.service.js";
import { WorkItemService, workItemService } from "./workitem.service.js";

export interface AzureSynchronizationResult {
    projects: number;
    repositories: number;
    workItems: number;
    testPlans: number;
    testSuites: number;
    testCases: number;
    graphNodes: number;
    graphEdges: number;
}

export class SynchronizationService {
    constructor(
        private readonly repository: AzureRepository = azureRepository,
        private readonly projects: ProjectService = projectService,
        private readonly workItems: WorkItemService = workItemService,
        private readonly testCases: TestCaseService = testCaseService,
        private readonly graphBuilder: GraphBuilderService = graphBuilderService,
        private readonly graphRepository: GraphRepository = knowledgeGraphRepository,
        private readonly relationships: GraphRelationshipService = graphRelationshipService
    ) {}

    async synchronize(project: string): Promise<AzureSynchronizationResult> {
        logger.info({ project }, "Starting Azure DevOps synchronization");
        await this.projects.importProjects();
        await this.projects.importRepositories(project);
        await this.projects.importIterations(project);
        await this.projects.importAreas(project);
        await this.workItems.importWorkItems(project);
        await this.testCases.importTestPlans(project);
        await this.testCases.importTestResults(project);
        const graph = this.synchronizeGraph();
        const result = {
            projects: this.repository.getProjects().length,
            repositories: this.repository.getRepositories().length,
            workItems: this.repository.getWorkItems().length,
            testPlans: this.repository.getTestPlans().length,
            testSuites: this.repository.getTestSuites().length,
            testCases: this.repository.getTestCases().length,
            graphNodes: graph.nodes.length,
            graphEdges: graph.edges.length
        };
        logger.info(result, "Azure DevOps synchronization completed");
        return result;
    }

    synchronizeGraph(): KnowledgeGraph {
        const graph = this.graphBuilder.build();
        const projectNodes = new Map<string, string>();
        this.repository.getProjects().forEach(project => {
            const id = this.ensure(graph.nodes, "Project", project.name, project.id);
            projectNodes.set(project.id, id);
        });
        const defaultProject = projectNodes.values().next().value as string | undefined;
        this.repository.getRepositories().forEach(repository => {
            const id = this.ensure(graph.nodes, "Repository", repository.name, repository.id);
            const projectId = projectNodes.get(repository.projectId) ?? defaultProject;
            if (projectId) this.connect(graph, projectId, id, "CONTAINS");
        });
        this.repository.getIterations().forEach(iteration => {
            const id = this.ensure(graph.nodes, "Iteration", iteration.name, iteration.id);
            if (defaultProject) this.connect(graph, defaultProject, id, "CONTAINS");
        });
        this.repository.getAreas().forEach(area => {
            const id = this.ensure(graph.nodes, "Area", area.name, String(area.id));
            if (defaultProject) this.connect(graph, defaultProject, id, "CONTAINS");
        });
        this.repository.getWorkItems().forEach(workItem => {
            const type: GraphNodeType = workItem.type === "Bug" ? "Bug" : "WorkItem";
            const id = this.ensure(graph.nodes, type, workItem.title, String(workItem.id));
            if (defaultProject) this.connect(graph, defaultProject, id, "CONTAINS");
            if (workItem.parentId !== null) {
                const parent = graph.nodes.find(node => node.id.endsWith(`-${workItem.parentId}`));
                if (parent) this.connect(graph, id, parent.id, "DEPENDS_ON");
            }
        });
        this.repository.getTestPlans().forEach(plan => {
            const id = this.ensure(graph.nodes, "TestPlan", plan.name, String(plan.id));
            if (defaultProject) this.connect(graph, defaultProject, id, "CONTAINS");
        });
        this.repository.getTestSuites().forEach(suite => {
            const suiteId = this.ensure(graph.nodes, "TestSuite", suite.name, String(suite.id));
            const plan = graph.nodes.find(node => node.type === "TestPlan" && node.id.endsWith(`-${suite.planId}`));
            if (plan) this.connect(graph, plan.id, suiteId, "CONTAINS");
        });
        this.repository.getTestCases().forEach(testCase => {
            const id = this.ensure(graph.nodes, "TestCase", testCase.title, String(testCase.id));
            if (defaultProject) this.connect(graph, defaultProject, id, "CONTAINS");
        });
        this.graphRepository.save(graph);
        return graph;
    }

    private ensure(nodes: GraphNode[], type: GraphNodeType, label: string, scope: string): string {
        const id = `azure-${type.toLowerCase()}:${this.normalize(scope)}-${this.normalize(label)}`;
        if (!nodes.some(node => node.id === id)) nodes.push({ id, type, label });
        return id;
    }

    private connect(graph: KnowledgeGraph, sourceId: string, targetId: string, type: GraphEdgeType): void {
        this.relationships.connect(graph.edges, sourceId, targetId, type);
    }

    private normalize(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
}

export const synchronizationService = new SynchronizationService();
