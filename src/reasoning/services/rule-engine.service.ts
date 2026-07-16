import { CoverageAnalysis } from "../../coverage/models/coverage.model.js";
import { ImpactReport, RiskLevel } from "../../impact/models/impact.model.js";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { Relationship } from "../../knowledge/models/relationship.model.js";
import { RequirementMapping } from "../../mapping/models/requirement-mapping.model.js";
import { Workflow } from "../../workflow/models/workflow.model.js";
import { Recommendation } from "../models/recommendation.model.js";

export interface ReasoningContext {
    mapping: RequirementMapping;
    coverage: CoverageAnalysis;
    pages: PageKnowledge[];
    relationships: Relationship[];
    workflows: Workflow[];
    impacts: ImpactReport[];
}

export class RuleEngineService {
    infer(context: ReasoningContext): Recommendation[] {
        return [
            ...this.gapRecommendations(context.coverage),
            ...this.coverageRecommendations(context.coverage),
            ...this.navigationRecommendations(context),
            ...this.mappingRecommendations(context.mapping),
            ...this.duplicateWorkflowRecommendations(context),
            ...this.unreachablePageRecommendations(context),
            ...this.regressionRecommendations(context)
        ];
    }

    risk(context: ReasoningContext): RiskLevel {
        const impactRisk = this.highestImpactRisk(context.impacts);
        if (impactRisk) return impactRisk;
        const scores = context.coverage.report.coverage;
        const minimum = Math.min(scores.pages, scores.workflow, scores.locators, scores.components);
        if (minimum < 50) return "HIGH";
        if (minimum < 75) return "MEDIUM";
        return "LOW";
    }

    private gapRecommendations(coverage: CoverageAnalysis): Recommendation[] {
        return coverage.details.map(gap => {
            if (gap.type === "VALIDATION") {
                return { type: "VALIDATION", message: gap.message.replace(/ missing$/i, " is uncovered") };
            }
            if (gap.type === "WORKFLOW") {
                return { type: "WORKFLOW", message: gap.message.replace(/ missing$/i, " is missing") };
            }
            if (gap.type === "PAGE") {
                return { type: "PAGE", message: gap.message.replace(/ not explored$/i, " should be explored") };
            }
            if (gap.type === "REQUIREMENT") {
                return { type: "MAPPING", message: "Requirement should be mapped to application knowledge" };
            }
            return { type: gap.type === "LOCATOR" ? "COVERAGE" : "PAGE", message: gap.message };
        });
    }

    private coverageRecommendations(coverage: CoverageAnalysis): Recommendation[] {
        return Object.entries(coverage.report.coverage)
            .filter(([, score]) => score < 75)
            .map(([category]) => ({
                type: "COVERAGE" as const,
                message: `${category[0].toUpperCase()}${category.slice(1)} coverage is low`
            }));
    }

    private navigationRecommendations(context: ReasoningContext): Recommendation[] {
        if (context.mapping.pages.length < 2) return [];
        const mapped = context.pages.filter(page => context.mapping.pages.some(name => this.matches(name, page.title)));
        const ids = new Set(mapped.map(page => page.id));
        const hasNavigation = context.relationships.some(relationship =>
            ids.has(relationship.sourcePageId) && ids.has(relationship.targetPageId)
        );
        return hasNavigation ? [] : [{
            type: "NAVIGATION",
            message: `Navigation between ${context.mapping.pages.join(" and ")} is not learned`
        }];
    }

    private mappingRecommendations(mapping: RequirementMapping): Recommendation[] {
        return mapping.pages.length === 0 ? [{
            type: "MAPPING",
            message: "Requirement is not mapped to the application"
        }] : [];
    }

    private duplicateWorkflowRecommendations(context: ReasoningContext): Recommendation[] {
        const relevant = context.workflows.filter(workflow =>
            context.mapping.pages.length === 0 || workflow.pages.some(page =>
                context.mapping.pages.some(mapped => this.matches(mapped, page))
            )
        );
        return relevant.filter((workflow, index) =>
            relevant.findIndex(item => item.name.toLowerCase() === workflow.name.toLowerCase()) !== index
        ).map(workflow => ({ type: "DUPLICATE", message: `Duplicate workflow detected: ${workflow.name}` }));
    }

    private unreachablePageRecommendations(context: ReasoningContext): Recommendation[] {
        if (context.mapping.pages.length < 2) return [];
        const targetNames = context.mapping.pages.slice(1);
        return context.pages.filter(page => targetNames.some(name => this.matches(name, page.title)))
            .filter(page => page.navigationTargets.length === 0 && !context.relationships.some(relationship =>
                relationship.targetPageId === page.id || relationship.sourcePageId === page.id
            )).map(page => ({ type: "REACHABILITY", message: `${page.title} page appears unreachable` }));
    }

    private regressionRecommendations(context: ReasoningContext): Recommendation[] {
        return context.impacts.filter(impact => impact.risk !== "LOW").map(impact => ({
            type: "REGRESSION",
            message: `${impact.changed} has ${impact.risk.toLowerCase()} regression risk`
        }));
    }

    private highestImpactRisk(impacts: readonly ImpactReport[]): RiskLevel | null {
        const rank: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        return impacts.reduce<RiskLevel | null>((highest, impact) =>
            !highest || rank[impact.risk] > rank[highest] ? impact.risk : highest
        , null);
    }

    private matches(expected: string, actual: string): boolean {
        return actual.toLowerCase().includes(expected.toLowerCase()) ||
            expected.toLowerCase().includes(actual.toLowerCase());
    }
}

export const ruleEngineService = new RuleEngineService();
