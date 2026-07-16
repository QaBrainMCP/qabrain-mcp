import { GraphQueryResult, KnowledgeGraph } from "../models/graph.model.js";
import { GraphNode } from "../models/graph-node.model.js";
import { graphRepository, GraphRepository } from "../repository/graph.repository.js";
import { graphRelationshipService, GraphRelationshipService } from "./graph-relationship.service.js";
import { graphSearchService, GraphSearchService } from "./graph-search.service.js";

export class GraphQueryService {
    private readonly queryCache = new Map<string, GraphQueryResult>();

    constructor(
        private readonly repository: GraphRepository = graphRepository,
        private readonly search: GraphSearchService = graphSearchService,
        private readonly relationships: GraphRelationshipService = graphRelationshipService
    ) {}

    query(queryText: string): GraphQueryResult {
        const graph = this.repository.get();
        const normalized = queryText.toLowerCase();
        const cacheKey = `${graph.builtAt.getTime()}:${normalized}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (normalized.includes("components") && normalized.includes("no locator")) {
            return this.componentsWithoutLocators(graph, queryText);
        }
        if (normalized.includes("impacted workflows")) {
            return this.impactedWorkflows(graph, queryText);
        }
        if (normalized.includes("uncovered requirements")) {
            return this.uncoveredRequirements(graph, queryText);
        }
        const subject = this.subject(queryText);
        const node = this.search.find(graph, subject)[0];
        const result = node ? this.connected(graph, node) : this.empty(queryText);
        this.queryCache.set(cacheKey, result);
        return result;
    }

    private connected(graph: KnowledgeGraph, node: GraphNode): GraphQueryResult {
        const ids = this.connectedIds(graph, node.id, 3);
        const related = graph.nodes.filter(candidate => ids.has(candidate.id));
        return {
            node: node.label,
            relatedPages: this.labels(related, "Page", node.id),
            components: this.labels(related, "Component"),
            locators: this.labels(related, "Locator"),
            requirements: this.labels(related, "Requirement"),
            workflows: this.labels(related, "Workflow"),
            coverage: this.labels(related, "Coverage"),
            impact: this.labels(related, "Impact")
        };
    }

    private componentsWithoutLocators(graph: KnowledgeGraph, queryText: string): GraphQueryResult {
        const components = graph.nodes.filter(node => node.type === "Component" && !graph.edges.some(edge =>
            edge.sourceId === node.id && edge.type === "USES" && graph.nodes.some(target =>
                target.id === edge.targetId && target.type === "Locator"
            )
        )).map(node => node.label);
        return { ...this.empty(queryText), components: this.unique(components) };
    }

    private impactedWorkflows(graph: KnowledgeGraph, queryText: string): GraphQueryResult {
        const workflowIds = graph.edges.filter(edge => edge.type === "AFFECTS").map(edge => edge.targetId);
        const workflows = graph.nodes.filter(node => node.type === "Workflow" && workflowIds.includes(node.id)).map(node => node.label);
        return { ...this.empty(queryText), workflows: this.unique(workflows) };
    }

    private uncoveredRequirements(graph: KnowledgeGraph, queryText: string): GraphQueryResult {
        const coverageIds = graph.nodes.filter(node => node.type === "Coverage" && node.label.includes("(uncovered)")).map(node => node.id);
        const requirementIds = graph.edges.filter(edge => edge.type === "COVERS" && coverageIds.includes(edge.sourceId))
            .map(edge => edge.targetId);
        const requirements = graph.nodes.filter(node => node.type === "Requirement" && requirementIds.includes(node.id))
            .map(node => node.label);
        return { ...this.empty(queryText), requirements: this.unique(requirements) };
    }

    private connectedIds(graph: KnowledgeGraph, nodeId: string, maxDepth: number): Set<string> {
        const visited = new Set([nodeId]);
        let frontier = [nodeId];
        for (let depth = 0; depth < maxDepth; depth += 1) {
            const next = frontier.flatMap(id => this.relationships.relatedIds(graph.edges, id))
                .filter(id => !visited.has(id));
            next.forEach(id => visited.add(id));
            frontier = next;
        }
        return visited;
    }

    private subject(query: string): string {
        const normalized = query.trim().replace(/[?.!]+$/, "");
        const patterns = [/related to\s+(.+?)(?:\s+page)?$/i, /using\s+(.+)$/i, /covering\s+(.+)$/i];
        const match = patterns.map(pattern => pattern.exec(normalized)).find(Boolean);
        return match?.[1]?.trim() ?? normalized;
    }

    private labels(nodes: readonly GraphNode[], type: GraphNode["type"], excludeId?: string): string[] {
        return this.unique(nodes.filter(node => node.type === type && node.id !== excludeId).map(node => node.label));
    }

    private empty(node: string): GraphQueryResult {
        return { node, relatedPages: [], components: [], locators: [], requirements: [], workflows: [], coverage: [], impact: [] };
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }
}

export const graphQueryService = new GraphQueryService();
