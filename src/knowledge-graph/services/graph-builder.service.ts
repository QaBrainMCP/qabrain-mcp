import { applicationMapService } from "../../application/services/application-map.service.js";
import { coverageRepository } from "../../coverage/repository/coverage.repository.js";
import { impactRepository } from "../../impact/repository/impact.repository.js";
import { knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { mappingRepository } from "../../mapping/repository/mapping.repository.js";
import { memoryStore } from "../../memory/repository/memory.store.js";
import { reasoningRepository } from "../../reasoning/repository/reasoning.repository.js";
import { logger } from "../../utils/logger.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { GraphEdgeType } from "../models/graph-edge.model.js";
import { KnowledgeGraph } from "../models/graph.model.js";
import { GraphNode, GraphNodeType } from "../models/graph-node.model.js";
import { graphRepository, GraphRepository } from "../repository/graph.repository.js";
import { graphRelationshipService, GraphRelationshipService } from "./graph-relationship.service.js";

export class GraphBuilderService {
    constructor(
        private readonly repository: GraphRepository = graphRepository,
        private readonly relationships: GraphRelationshipService = graphRelationshipService
    ) {}

    build(): KnowledgeGraph {
        logger.info("Building QA knowledge graph");
        const nodes: GraphNode[] = [];
        const nodeIndex = new Map<string, GraphNode>();
        const edges: KnowledgeGraph["edges"] = [];
        const applicationMap = applicationMapService.getMap();
        const applications = this.unique([
            applicationMap.applicationName,
            ...memoryStore.getApplications().map(application => application.name)
        ].filter(Boolean));
        const applicationIds = applications.map(name => this.ensure(nodes, nodeIndex, "Application", name));
        const primaryApplication = applicationIds[0];

        const pageByTitle = new Map<string, string>();
        const addPage = (title: string): string => {
            const id = this.ensure(nodes, nodeIndex, "Page", title);
            pageByTitle.set(title.toLowerCase(), id);
            if (primaryApplication) this.connect(edges, primaryApplication, id, "CONTAINS");
            return id;
        };

        applicationMap.pages.forEach(page => addPage(page.title));
        mappingRepository.getAll().forEach(mapping => mapping.pages.forEach(addPage));

        const componentIds = new Map<string, string>();
        const locatorIds = new Map<string, string>();
        const pages = knowledgeRepository.getPages();
        const relationships = knowledgeRepository.getRelationships();
        const workflows = workflowMemory.getAll();
        const pageById = new Map(pages.map(page => [page.id, page]));
        pages.forEach(page => {
            const pageId = addPage(page.title);
            const components = [
                ...page.buttons, ...page.links, ...page.inputs, ...page.dropdowns,
                ...page.forms, ...page.tables, ...page.dialogs
            ];
            components.forEach(component => {
                const componentId = this.ensure(nodes, nodeIndex, "Component", component.name, page.id);
                componentIds.set(`${page.id}:${component.name.toLowerCase()}`, componentId);
                this.connect(edges, pageId, componentId, "CONTAINS");
            });
            page.locators.forEach(locator => {
                const locatorId = this.ensure(nodes, nodeIndex, "Locator", locator, page.id);
                locatorIds.set(`${page.id}:${locator.toLowerCase()}`, locatorId);
                this.connect(edges, pageId, locatorId, "CONTAINS");
                components.filter(component => this.matches(component.name, locator)).forEach(component => {
                    const componentId = componentIds.get(`${page.id}:${component.name.toLowerCase()}`);
                    if (componentId) this.connect(edges, componentId, locatorId, "USES");
                });
            });
        });

        relationships.forEach(relationship => {
            const source = pageById.get(relationship.sourcePageId);
            const target = pageById.get(relationship.targetPageId);
            if (source && target) this.connect(edges, addPage(source.title), addPage(target.title), "NAVIGATES_TO");
        });

        workflows.forEach(workflow => {
            const workflowId = this.ensure(nodes, nodeIndex, "Workflow", workflow.name);
            workflow.pages.forEach(page => this.connect(edges, workflowId, addPage(page), "USES"));
            workflow.locators.forEach(locator => {
                const locatorId = this.findOrCreateLocator(nodes, nodeIndex, locator, locatorIds);
                this.connect(edges, workflowId, locatorId, "USES");
            });
        });

        coverageRepository.getRecords().forEach((record, index) => {
            const requirementId = this.ensure(nodes, nodeIndex, "Requirement", record.report.requirement);
            const coverageId = this.ensure(nodes, nodeIndex, "Coverage", this.coverageLabel(record.report), String(index));
            this.connect(edges, coverageId, requirementId, "COVERS");
            record.pages.forEach(page => this.connect(edges, requirementId, addPage(page), "DEPENDS_ON"));
            record.elements.forEach(element => this.componentNodes(nodes, element).forEach(componentId =>
                this.connect(edges, requirementId, componentId, "DEPENDS_ON")
            ));
            workflows.filter(workflow => workflow.pages.some(page =>
                record.pages.some(required => this.matches(required, page))
            )).forEach(workflow => this.connect(edges, requirementId, this.ensure(nodes, nodeIndex, "Workflow", workflow.name), "IMPLEMENTS"));
        });
        coverageRepository.getAll().forEach((report, index) => {
            const requirementId = this.ensure(nodes, nodeIndex, "Requirement", report.requirement);
            const coverageId = this.ensure(nodes, nodeIndex, "Coverage", this.coverageLabel(report), `report-${index}`);
            this.connect(edges, coverageId, requirementId, "COVERS");
        });

        impactRepository.getAll().forEach((impact, index) => {
            const impactId = this.ensure(nodes, nodeIndex, "Impact", `Impact: ${impact.changed}`, String(index));
            impact.affectedPages.forEach(page => this.connect(edges, impactId, addPage(page), "AFFECTS"));
            impact.affectedWorkflows.forEach(workflow => this.connect(edges, impactId, this.ensure(nodes, nodeIndex, "Workflow", workflow), "AFFECTS"));
            impact.affectedRequirements.forEach(requirement => this.connect(edges, impactId, this.ensure(nodes, nodeIndex, "Requirement", requirement), "AFFECTS"));
            impact.affectedComponents.forEach(component => this.componentNodes(nodes, component).forEach(componentId =>
                this.connect(edges, impactId, componentId, "AFFECTS")
            ));
        });

        reasoningRepository.getAll().forEach((result, resultIndex) => {
            result.recommendations.forEach((recommendation, index) => {
                const recommendationId = this.ensure(nodes, nodeIndex, "Recommendation", recommendation, `${resultIndex}-${index}`);
                if (primaryApplication) this.connect(edges, recommendationId, primaryApplication, "RECOMMENDS");
            });
        });

        const graph = { nodes, edges, builtAt: new Date() };
        this.repository.save(graph);
        logger.info({ nodeCount: nodes.length, edgeCount: edges.length }, "QA knowledge graph built");
        return graph;
    }

    private ensure(nodes: GraphNode[], nodeIndex: Map<string, GraphNode>, type: GraphNodeType, label: string, scope = ""): string {
        const id = `${type.toLowerCase()}:${this.normalize(scope ? `${scope}-${label}` : label)}`;
        const existing = nodeIndex.get(id);
        if (!existing) {
            const node = { id, type, label };
            nodeIndex.set(id, node);
            nodes.push(node);
        }
        return id;
    }

    private findOrCreateLocator(nodes: GraphNode[], nodeIndex: Map<string, GraphNode>, locator: string, locatorIds: ReadonlyMap<string, string>): string {
        const existing = [...locatorIds.entries()].find(([key]) => this.matches(locator, key.split(":").slice(1).join(":")));
        return existing?.[1] ?? this.ensure(nodes, nodeIndex, "Locator", locator);
    }

    private componentNodes(nodes: readonly GraphNode[], component: string): string[] {
        return nodes.filter(node => node.type === "Component" && this.matches(component, node.label)).map(node => node.id);
    }

    private connect(edges: KnowledgeGraph["edges"], sourceId: string, targetId: string, type: GraphEdgeType): void {
        this.relationships.connect(edges, sourceId, targetId, type);
    }

    private matches(expected: string, actual: string): boolean {
        const normalize = (value: string) => value.toLowerCase().replace(/\s+button$/, "");
        const left = normalize(expected);
        const right = normalize(actual);
        return right.includes(left) || left.includes(right);
    }

    private normalize(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }

    private coverageLabel(report: { requirement: string; gaps: string[] }): string {
        return `Coverage: ${report.requirement}${report.gaps.length > 0 ? " (uncovered)" : ""}`;
    }
}

export const graphBuilderService = new GraphBuilderService();
