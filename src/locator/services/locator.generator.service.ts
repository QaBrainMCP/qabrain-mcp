import { ElementContext } from "../models/element-context.model.js";
import { LocatorCandidate } from "../models/candidate-locator.model.js";

const GENERATED_BY = "LocatorGeneratorService";

export class LocatorGeneratorService {
    generate(context: ElementContext): LocatorCandidate[] {
        const candidates: LocatorCandidate[] = [];

        this.push(candidates, "data-testid", context["data-testid"] ? `[data-testid=${this.q(context["data-testid"])}]` : undefined);
        this.push(candidates, "data-test", context["data-test"] ? `[data-test=${this.q(context["data-test"])}]` : undefined);
        this.push(candidates, "data-qa", context["data-qa"] ? `[data-qa=${this.q(context["data-qa"])}]` : undefined);
        this.push(candidates, "id", context.id ? `#${context.id}` : undefined);
        this.push(candidates, "name", context.nameAttribute ? `[name=${this.q(context.nameAttribute)}]` : undefined);
        this.push(candidates, "aria-label", context.ariaLabel ? `[aria-label=${this.q(context.ariaLabel)}]` : undefined);
        this.push(candidates, "role", context.role ? (context.ariaLabel ? `${context.role}|${context.ariaLabel}` : context.role) : undefined);
        this.push(candidates, "placeholder", context.placeholder);
        this.push(candidates, "label-association", context.label);
        this.push(candidates, "title", context.title ? `[title=${this.q(context.title)}]` : undefined);
        this.push(candidates, "alt", context.alt ? `[alt=${this.q(context.alt)}]` : undefined);
        this.push(candidates, "href", context.href ? `[href=${this.q(context.href)}]` : undefined);
        this.push(candidates, "visible-text", context.text);
        this.push(candidates, "css", context.cssPath);
        this.push(candidates, "xpath", context.xpath);

        return this.unique(candidates);
    }

    private push(candidates: LocatorCandidate[], strategy: LocatorCandidate["strategy"], value: string | undefined): void {
        if (!value || !value.trim()) return;
        candidates.push({
            strategy,
            value,
            matchedCount: 0,
            isUnique: false,
            isValid: false,
            automationRisk: "high",
            selfHealingCandidate: false,
            confidence: 0,
            stability: 0,
            uniqueness: 0,
            readability: 0,
            maintainability: 0,
            readable: 0,
            generatedBy: GENERATED_BY
            ,
            scoreBreakdown: {
                uniquenessScore: 0,
                stabilityScore: 0,
                readabilityScore: 0,
                maintainabilityScore: 0,
                frameworkCompatibilityScore: 0
            },
            failureReasons: [],
            recommendations: [],
            explanation: ""
        });
    }

    private unique(candidates: LocatorCandidate[]): LocatorCandidate[] {
        const seen = new Set<string>();
        return candidates.filter(candidate => {
            const key = `${candidate.strategy}:${candidate.value}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private q(value: string): string {
        return JSON.stringify(value);
    }
}
