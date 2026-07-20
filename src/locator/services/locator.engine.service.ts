import { Locator, Page } from "playwright";
import { LocatorCandidate } from "../models/candidate-locator.model.js";
import { ElementContext } from "../models/element-context.model.js";
import { LocatorResult } from "../models/locator-result.model.js";
import { LocatorGeneratorService } from "./locator.generator.service.js";
import { LocatorScorerService } from "./locator.scorer.service.js";
import { LocatorSelectorService } from "./locator.selector.service.js";

export class LocatorEngineService {
    private readonly generator = new LocatorGeneratorService();
    private readonly scorer = new LocatorScorerService();
    private readonly selector = new LocatorSelectorService();

    async build(
        page: Page,
        _locator: Locator,
        context: ElementContext,
        fallbackSelector: string
    ): Promise<LocatorResult> {
        const enrichedContext: ElementContext = {
            ...context,
            cssPath: context.cssPath || fallbackSelector
        };

        const generated = this.generator.generate(enrichedContext);
        const scoredCandidates: LocatorCandidate[] = [];

        for (const candidate of generated) {
            const validation = await this.validateCandidate(page, candidate, enrichedContext);
            const validatedCandidate: LocatorCandidate = {
                ...candidate,
                matchedCount: validation.matchedCount,
                isUnique: validation.isUnique,
                isValid: validation.isValid
            };

            const scored = this.scorer.score(validatedCandidate, validation.matchedCount);

            if (scored.isValid) {
                scoredCandidates.push(scored);
            }
        }

        if (scoredCandidates.length === 0) {
            throw new Error("No valid locator candidates generated");
        }

        const bestLocator = this.selector.select(scoredCandidates);
        const fallbackLocators = this.sortByQuality(
            scoredCandidates.filter(candidate =>
                !(candidate.strategy === bestLocator.strategy && candidate.value === bestLocator.value)
            )
        );

        return {
            bestLocator,
            candidates: scoredCandidates,
            fallbackLocators
        };
    }

    private sortByQuality(candidates: LocatorCandidate[]): LocatorCandidate[] {
        return [...candidates].sort((a, b) => {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            if (b.uniqueness !== a.uniqueness) return b.uniqueness - a.uniqueness;
            return b.stability - a.stability;
        });
    }

    private async validateCandidate(
        page: Page,
        candidate: LocatorCandidate,
        context: ElementContext
    ): Promise<{ matchedCount: number; isUnique: boolean; isValid: boolean }> {
        if (!candidate.value) {
            return { matchedCount: 0, isUnique: false, isValid: false };
        }

        const matchedCount = await this.matchCount(page, candidate, context);
        const isValid = matchedCount > 0;

        return {
            matchedCount,
            isUnique: matchedCount === 1,
            isValid
        };
    }

    private async matchCount(
        page: Page,
        candidate: LocatorCandidate,
        context: ElementContext
    ): Promise<number> {
        if (!candidate.value) return 0;

        try {
            if (
                candidate.strategy === "data-testid" ||
                candidate.strategy === "data-test" ||
                candidate.strategy === "data-qa" ||
                candidate.strategy === "id" ||
                candidate.strategy === "name" ||
                candidate.strategy === "aria-label" ||
                candidate.strategy === "title" ||
                candidate.strategy === "alt" ||
                candidate.strategy === "href" ||
                candidate.strategy === "css"
            ) {
                return await page.locator(candidate.value).count();
            }

            if (candidate.strategy === "xpath") {
                return await page.locator(`xpath=${candidate.value}`).count();
            }

            if (candidate.strategy === "visible-text") {
                return await page.getByText(candidate.value).count();
            }

            if (candidate.strategy === "placeholder") {
                return await page.getByPlaceholder(candidate.value).count();
            }

            if (candidate.strategy === "label-association") {
                return await page.getByLabel(candidate.value).count();
            }

            if (candidate.strategy === "role") {
                if (!context.role) return 0;
                const name = context.ariaLabel || context.text || context.label || context.nameAttribute;
                if (name) {
                    return await page.getByRole(context.role as "button", { name }).count();
                }
                return await page.getByRole(context.role as "button").count();
            }

            return 0;
        } catch {
            return 0;
        }
    }
}

export const locatorEngineService = new LocatorEngineService();
