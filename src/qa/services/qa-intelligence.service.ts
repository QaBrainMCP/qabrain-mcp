import { Requirement, Scenario } from "../../requirements/models/requirement.model.js";
import { gherkinParser } from "../../requirements/parser/gherkin.parser.js";
import { Step } from "../../requirements/models/step.model.js";

export interface QAIntelligenceItem {
    scenario: string;
    step: Step;
    intent: string;
    entities: Array<{ type: string; value: string }>;
}

export class QAIntelligenceService {
    analyze(feature: string): QAIntelligenceItem[] {
        const requirement = gherkinParser.parse(feature);
        const items: QAIntelligenceItem[] = [];

        for (const scenario of requirement.scenarios) {
            for (const step of scenario.steps) {
                items.push({
                    scenario: scenario.name || requirement.title,
                    step,
                    intent: this.intentFor(step),
                    entities: this.entitiesFor(step.text)
                });
            }
        }

        return items;
    }

    private intentFor(step: Step): string {
        if (step.keyword === "Then") {
            return "VALIDATION";
        }

        return "ACTION";
    }

    private entitiesFor(text: string): Array<{ type: string; value: string }> {
        const entities: Array<{ type: string; value: string }> = [];
        const matches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) ?? [];

        for (const match of matches) {
            entities.push({ type: "phrase", value: match });
        }

        return entities;
    }
}

export const qaIntelligence = new QAIntelligenceService();
