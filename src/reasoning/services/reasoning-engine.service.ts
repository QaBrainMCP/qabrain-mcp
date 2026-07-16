import { coverageEngineService, CoverageEngineService } from "../../coverage/services/coverage-engine.service.js";
import { impactRepository, ImpactRepository } from "../../impact/repository/impact.repository.js";
import { knowledgeRepository, KnowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { requirementMappingService, RequirementMappingService } from "../../mapping/services/requirement-mapping.service.js";
import { logger } from "../../utils/logger.js";
import { workflowMemory, WorkflowMemoryService } from "../../workflow/services/workflow.memory.service.js";
import { ReasoningResult } from "../models/reasoning.model.js";
import { reasoningRepository, ReasoningRepository } from "../repository/reasoning.repository.js";
import { confidenceService, ConfidenceService } from "./confidence.service.js";
import { recommendationService, RecommendationService } from "./recommendation.service.js";
import { ruleEngineService, RuleEngineService } from "./rule-engine.service.js";

export class ReasoningEngineService {
    constructor(
        private readonly repository: ReasoningRepository = reasoningRepository,
        private readonly coverageEngine: CoverageEngineService = coverageEngineService,
        private readonly mappingService: RequirementMappingService = requirementMappingService,
        private readonly knowledge: KnowledgeRepository = knowledgeRepository,
        private readonly impacts: ImpactRepository = impactRepository,
        private readonly workflows: WorkflowMemoryService = workflowMemory,
        private readonly rules: RuleEngineService = ruleEngineService,
        private readonly recommendations: RecommendationService = recommendationService,
        private readonly confidence: ConfidenceService = confidenceService
    ) {}

    reason(feature: string): ReasoningResult {
        logger.info("Starting QA reasoning");
        const coverage = this.coverageEngine.analyze(feature);
        const mapping = this.mappingService.map(feature);
        const impacts = this.impacts.getAll().filter(impact =>
            mapping.pages.some(page => this.matches(page, impact.changed))
        );
        const context = {
            mapping,
            coverage,
            pages: this.knowledge.getPages(),
            relationships: this.knowledge.getRelationships(),
            workflows: this.workflows.getAll(),
            impacts
        };
        const findings = this.rules.infer(context);
        const result: ReasoningResult = {
            recommendations: this.recommendations.build(findings),
            risk: this.rules.risk(context),
            confidence: this.confidence.calculate(
                coverage.report.coverage,
                findings.length,
                impacts.length > 0
            )
        };

        this.repository.save(result);
        logger.info({ result }, "QA reasoning completed");
        return result;
    }

    private matches(expected: string, actual: string): boolean {
        return actual.toLowerCase().includes(expected.toLowerCase()) ||
            expected.toLowerCase().includes(actual.toLowerCase());
    }
}

export const reasoningEngineService = new ReasoningEngineService();
