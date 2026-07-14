import { requirementService } from "../../requirements/services/requirement.service.js";
import { stepAnalyzer } from "../../requirements/analyzer/step.analyzer.js";
import { entityExtractor } from "../../requirements/entity/entity.extractor.js";

export class QAIntelligenceService {

    analyze(feature: string) {

        const requirement = requirementService.parse(feature);

        const result = [];

        for (const scenario of requirement.scenarios) {

            for (const step of scenario.steps) {

                result.push({

                    scenario: scenario.name,

                    step,

                    intent: stepAnalyzer.analyze(step),

                    entities: entityExtractor.extract(step)

                });

            }

        }

        return result;

    }

}

export const qaIntelligence = new QAIntelligenceService();