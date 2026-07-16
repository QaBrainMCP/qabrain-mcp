import { coverageRepository, CoverageRepository } from "../../coverage/repository/coverage.repository.js";
import { Component } from "../../knowledge/models/component.model.js";
import { logger } from "../../utils/logger.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { ImpactReport } from "../models/impact.model.js";
import { impactRepository, ImpactRepository } from "../repository/impact.repository.js";
import { CoverageImpactService } from "./coverage-impact.service.js";
import { PageImpactService } from "./page-impact.service.js";
import { RequirementImpactService } from "./requirement-impact.service.js";
import { WorkflowImpactService } from "./workflow-impact.service.js";

export class ImpactEngineService {
    constructor(
        private readonly repository: ImpactRepository = impactRepository,
        private readonly coverage: CoverageRepository = coverageRepository,
        private readonly pageImpact = new PageImpactService(),
        private readonly workflowImpact = new WorkflowImpactService(),
        private readonly requirementImpact = new RequirementImpactService(),
        private readonly coverageImpact = new CoverageImpactService()
    ) {}

    analyze(changed: string): ImpactReport {
        logger.info({ changed }, "Starting change impact analysis");
        const pageResult = this.pageImpact.find(changed);
        const affectedWorkflows = this.workflowImpact.find(changed, pageResult.pages, workflowMemory.getAll());
        const affectedRecords = this.requirementImpact.find(changed, pageResult.pages, this.coverage.getRecords());
        const affectedRequirements = this.unique(affectedRecords.map(record => record.report.requirement));
        const coverageScore = this.coverageImpact.coverageScore(affectedRecords);
        const report: ImpactReport = {
            changed,
            affectedPages: pageResult.pages,
            affectedRequirements,
            affectedWorkflows,
            affectedComponents: this.componentNames(pageResult.components),
            risk: this.coverageImpact.calculateRisk(
                pageResult.pages.length,
                affectedWorkflows.length,
                affectedRequirements.length,
                coverageScore
            ),
            recommendedActions: this.recommendations(changed, affectedRequirements, affectedWorkflows, pageResult.components),
            confidence: this.confidence(pageResult.pages.length, affectedWorkflows.length, affectedRequirements.length, coverageScore)
        };

        this.repository.save(report);
        logger.info({ report }, "Change impact analysis completed");
        return report;
    }

    private componentNames(components: readonly Component[]): string[] {
        return this.unique(components.map(component =>
            component.type === "button" ? `${component.name} Button` : component.name
        ));
    }

    private recommendations(
        changed: string,
        requirements: readonly string[],
        workflows: readonly string[],
        components: readonly Component[]
    ): string[] {
        const actions: string[] = [];
        if (requirements.length > 0) actions.push(`Review ${changed} Requirement`);
        if (workflows.length > 0) actions.push(`Verify ${changed} Workflow`);
        if (components.length > 0) actions.push(`Validate ${changed} Components`);
        if (actions.length === 0) actions.push(`Explore ${changed} application knowledge`);
        return actions;
    }

    private confidence(pageCount: number, workflowCount: number, requirementCount: number, coverageScore: number): number {
        return Math.min(100, 80 + Math.min(5, pageCount * 2) + Math.min(5, workflowCount * 2) +
            Math.min(5, requirementCount * 2) + Math.round(coverageScore / 20));
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }
}

export const impactEngineService = new ImpactEngineService();
