import { applicationMapService } from "../../application/services/application-map.service.js";
import { stepAnalyzer } from "../../requirements/analyzer/step.analyzer.js";
import { Entity } from "../../requirements/entity/entity.model.js";
import { entityExtractor } from "../../requirements/entity/entity.extractor.js";
import { requirementService } from "../../requirements/services/requirement.service.js";
import { logger } from "../../utils/logger.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { RequirementMapping } from "../models/requirement-mapping.model.js";
import { mappingRepository } from "../repository/mapping.repository.js";
import { locatorMapperService } from "./locator-mapper.service.js";
import { pageMapperService } from "./page-mapper.service.js";
import { workflowMapperService } from "./workflow-mapper.service.js";

export class RequirementMappingService {
    map(feature: string): RequirementMapping {
        logger.info("Starting requirement mapping");
        const requirement = requirementService.parse(feature);
        const entities: Entity[] = [];

        for (const scenario of requirement.scenarios) {
            for (const step of scenario.steps) {
                stepAnalyzer.analyze(step);
                entities.push(...entityExtractor.extract(step));
            }
        }

        const requestedPages = this.valuesFor(entities, "PAGE");
        const elements = this.unique([
            ...this.valuesFor(entities, "FIELD"),
            ...this.valuesFor(entities, "BUTTON")
        ]);
        const applicationMap = applicationMapService.getMap();
        const pages = pageMapperService.map(requestedPages, applicationMap.pages);
        const workflows = workflowMemory.getAll();
        const workflow = workflowMapperService.map(pages, workflows);
        const knownLocators = locatorMapperService.map(elements, workflows);
        const mapping: RequirementMapping = {
            application: applicationMap.applicationName || workflow?.application || "Unknown",
            pages,
            elements,
            workflow: workflow?.name ?? null,
            knownLocators,
            confidence: this.confidence(requestedPages, pages, elements, knownLocators, workflow !== null)
        };

        mappingRepository.save(mapping);
        logger.info({ mapping }, "Requirement mapping completed");
        return mapping;
    }

    private valuesFor(entities: readonly Entity[], type: Entity["type"]): string[] {
        return this.unique(entities.filter(entity => entity.type === type).map(entity => entity.value));
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }

    private confidence(
        requestedPages: readonly string[],
        pages: readonly string[],
        elements: readonly string[],
        knownLocators: readonly string[],
        hasWorkflow: boolean
    ): number {
        const pageCoverage = requestedPages.length === 0 ? 0 : pages.length / requestedPages.length;
        const locatorCoverage = elements.length === 0 ? 0 : knownLocators.length / elements.length;
        return Math.round(
            20 + (30 * pageCoverage) + (elements.length > 0 ? 20 : 0) +
            (15 * locatorCoverage) + (hasWorkflow ? 10 : 0)
        );
    }
}

export const requirementMappingService = new RequirementMappingService();
