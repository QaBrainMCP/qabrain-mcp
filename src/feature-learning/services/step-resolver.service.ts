import { randomUUID } from "node:crypto";
import { Locator, Page } from "playwright";

import { pageManager } from "../../browser/page.manager.js";
import { Component } from "../../knowledge/models/component.model.js";
import { PageKnowledge } from "../../knowledge/models/page-knowledge.model.js";
import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { ComponentDiscoveryService, componentDiscoveryService } from "../../knowledge/services/component-discovery.service.js";
import { ElementContext } from "../../locator/models/element-context.model.js";
import { LocatorEngineService, locatorEngineService } from "../../locator/services/locator.engine.service.js";
import { logger } from "../../utils/logger.js";
import { ExecutionActionType, ExecutionStep } from "../models/execution-step.model.js";
import {
    ResolvedStep,
    ResolvedStepAlternative,
    ResolutionMethod
} from "../models/resolved-step.model.js";

const AMBIGUITY_THRESHOLD = 70;

interface PlaywrightAdapter {
    getPage(): Promise<Page>;
}

interface RankedCandidate {
    component: Component;
    confidence: number;
    selectedLocator: string;
}

interface ResolverIntent {
    action: ExecutionActionType;
    target: string | null;
}

interface StepResolverDependencies {
    knowledgeRepository?: KnowledgeRepository;
    locatorEngine?: LocatorEngineService;
    componentDiscovery?: ComponentDiscoveryService;
    playwrightAdapter?: PlaywrightAdapter;
    now?: () => number;
}

export class StepResolverService {
    private readonly knowledgeRepository: KnowledgeRepository;
    private readonly locatorEngine: LocatorEngineService;
    private readonly componentDiscovery: ComponentDiscoveryService;
    private readonly playwrightAdapter: PlaywrightAdapter;
    private readonly now: () => number;

    constructor(dependencies: StepResolverDependencies = {}) {
        this.knowledgeRepository = dependencies.knowledgeRepository ?? knowledgeRepository;
        this.locatorEngine = dependencies.locatorEngine ?? locatorEngineService;
        this.componentDiscovery = dependencies.componentDiscovery ?? componentDiscoveryService;
        this.playwrightAdapter = dependencies.playwrightAdapter ?? pageManager;
        this.now = dependencies.now ?? (() => Date.now());
    }

    async resolveExecutionStep(step: ExecutionStep): Promise<ResolvedStep> {
        return this.resolveStepText(step.originalStep.text, {
            action: step.actionType,
            target: step.target
        });
    }

    async resolveStepText(stepText: string, intentOverride?: Partial<ResolverIntent>): Promise<ResolvedStep> {
        const startedAt = this.now();
        const page = await this.playwrightAdapter.getPage();
        const intent = this.extractIntent(stepText, intentOverride);

        let discoveryPerformed = false;
        let currentPageKnowledge = this.knowledgeRepository.getPageByUrl(page.url());
        let components = this.flattenKnowledgeComponents(currentPageKnowledge);
        let ranked = await this.rankCandidates(page, components, intent.target);

        if (ranked.length === 0 && intent.target) {
            const discovered = await this.componentDiscovery.discover(page);
            discoveryPerformed = true;
            await this.saveDiscoveredPageKnowledge(page, discovered, currentPageKnowledge);
            currentPageKnowledge = this.knowledgeRepository.getPageByUrl(page.url());
            components = this.flattenKnowledgeComponents(currentPageKnowledge);
            ranked = await this.rankCandidates(page, components, intent.target);
        }

        const result = this.toResolvedStep(intent, ranked, discoveryPerformed);
        const resolutionTime = this.now() - startedAt;

        logger.info(
            {
                action: result.action,
                target: result.target,
                resolutionMethod: result.resolutionMethod,
                selected: result.matchedComponent?.name ?? null,
                confidence: result.confidence,
                candidatesEvaluated: ranked.length,
                discoveryTriggered: discoveryPerformed,
                resolutionTime
            },
            "Step resolution completed"
        );

        return result;
    }

    private extractIntent(stepText: string, override?: Partial<ResolverIntent>): ResolverIntent {
        const normalized = this.normalize(stepText);

        const action = override?.action ?? this.detectAction(normalized);
        const target = override?.target ?? this.extractTarget(normalized, action);

        return {
            action,
            target: target?.trim() || null
        };
    }

    private detectAction(text: string): ExecutionActionType {
        const lower = text.toLowerCase();

        if (this.includesAny(lower, ["open", "navigate", "go to", "visit"])) return "NAVIGATE";
        if (this.includesAny(lower, ["enter", "type", "fill", "input", "select"])) return "INPUT";
        if (this.includesAny(lower, ["click", "press", "submit", "save"])) return "CLICK";
        if (this.includesAny(lower, ["verify", "should see", "should display", "should contain", "should be"])) return "VERIFY";
        return "CUSTOM";
    }

    private extractTarget(text: string, action: ExecutionActionType): string | null {
        const byAction: Record<ExecutionActionType, string[]> = {
            NAVIGATE: ["open", "navigate", "go to", "visit"],
            INPUT: ["enter", "type", "fill", "input", "select"],
            CLICK: ["click", "press", "submit", "save"],
            VERIFY: ["verify", "should see", "should display", "should contain", "should be"],
            CUSTOM: []
        };

        for (const term of byAction[action]) {
            const expression = new RegExp(`\\b${this.escapeRegex(term)}\\b\\s+(.+)$`, "iu");
            const match = expression.exec(text);
            if (match?.[1]?.trim()) {
                return match[1].trim();
            }
        }

        return action === "CUSTOM" ? text : null;
    }

    private async rankCandidates(
        page: Page,
        components: Component[],
        target: string | null
    ): Promise<RankedCandidate[]> {
        if (!target) {
            return [];
        }

        const ranked: RankedCandidate[] = [];

        for (const component of components) {
            const locator = this.preferredLocator(component);
            if (!locator) {
                continue;
            }

            const validated = await this.validateWithLocatorEngine(page, component, locator);
            if (!validated) {
                continue;
            }

            const confidence = this.scoreComponent(component, target, locator);
            if (confidence <= 0) {
                continue;
            }

            ranked.push({
                component,
                confidence,
                selectedLocator: locator
            });
        }

        return ranked.sort((a, b) => b.confidence - a.confidence);
    }

    private scoreComponent(component: Component, target: string, selectedLocator: string): number {
        const normalizedTarget = this.normalize(target).toLowerCase();
        const metadata = component.metadata ?? {};
        const names = [
            component.name,
            metadata.text,
            metadata["aria-label"],
            metadata.name,
            metadata.nameAttribute,
            metadata.placeholder,
            metadata.id,
            metadata.role
        ].filter((item): item is string => Boolean(item));

        const exact = names.some(name => this.normalize(name).toLowerCase() === normalizedTarget);
        const includes = names.some(name => this.normalize(name).toLowerCase().includes(normalizedTarget));
        const similarity = Math.max(...names.map(name => this.stringSimilarity(normalizedTarget, this.normalize(name).toLowerCase())), 0);
        const visible = metadata.visible !== false;
        const unique = this.usesUniqueLocator(component, selectedLocator);

        let score = 0;
        if (exact) score += 30;
        if (includes) score += 20;
        score += similarity * 20;
        if (metadata["aria-label"]) score += 8;
        if (metadata.placeholder) score += 6;
        if (metadata.role) score += 5;
        if (metadata.id) score += 8;
        if (visible) score += 10;
        if (unique) score += 10;

        if (this.isNthSelector(selectedLocator)) {
            score -= 25;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    private preferredLocator(component: Component): string | null {
        const validatedCandidates = [...(component.candidateLocators ?? [])]
            .filter(candidate => candidate.isValid)
            .sort((a, b) => {
                if (b.confidence !== a.confidence) return b.confidence - a.confidence;
                if (b.stability !== a.stability) return b.stability - a.stability;
                return b.uniqueness - a.uniqueness;
            })
            .map(candidate => candidate.value);

        const stableFallbacks = [...(component.fallbackLocators ?? [])]
            .filter(candidate => candidate.isValid)
            .sort((a, b) => {
                if (b.stability !== a.stability) return b.stability - a.stability;
                return b.confidence - a.confidence;
            })
            .map(candidate => candidate.value);

        const candidatePool = [...validatedCandidates, ...stableFallbacks, component.selector].filter(Boolean);
        const nonNth = candidatePool.filter(locator => !this.isNthSelector(locator));

        if (nonNth.length > 0) {
            return nonNth[0] ?? null;
        }

        return candidatePool[0] ?? null;
    }

    private async validateWithLocatorEngine(page: Page, component: Component, locatorValue: string): Promise<boolean> {
        try {
            const locator = page.locator(locatorValue).first();
            const context: ElementContext = {
                ...(component.metadata ?? {}),
                ariaLabel: component.metadata?.["aria-label"],
                cssPath: component.selector,
                visible: component.metadata?.visible ?? true
            };
            const result = await this.locatorEngine.build(page, locator, context, component.selector);
            return result.bestLocator.isValid;
        } catch {
            return false;
        }
    }

    private toResolvedStep(
        intent: ResolverIntent,
        ranked: RankedCandidate[],
        discoveryPerformed: boolean
    ): ResolvedStep {
        const alternatives = ranked.slice(0, 5).map<ResolvedStepAlternative>(item => ({
            componentName: item.component.name,
            componentType: item.component.type,
            locator: item.selectedLocator,
            confidence: item.confidence
        }));

        const best = ranked[0];
        if (!best) {
            return {
                action: intent.action,
                target: intent.target,
                matchedComponent: null,
                selectedLocator: null,
                confidence: 0,
                alternatives,
                resolutionMethod: "UNRESOLVED",
                discoveryPerformed,
                ambiguityWarning: intent.target
                    ? `No resolvable component found for '${intent.target}'.`
                    : "No resolvable component found."
            };
        }

        const belowThreshold = best.confidence < AMBIGUITY_THRESHOLD;
        const method: ResolutionMethod = belowThreshold
            ? "AMBIGUOUS"
            : (discoveryPerformed ? "DISCOVERY" : "KNOWLEDGE");

        return {
            action: intent.action,
            target: intent.target,
            matchedComponent: belowThreshold
                ? null
                : {
                    name: best.component.name,
                    type: best.component.type,
                    selector: best.component.selector
                },
            selectedLocator: belowThreshold ? null : best.selectedLocator,
            confidence: best.confidence,
            alternatives,
            resolutionMethod: method,
            discoveryPerformed,
            ambiguityWarning: belowThreshold
                ? `Ambiguous match for '${intent.target ?? "step"}' (confidence ${best.confidence}).`
                : undefined
        };
    }

    private async saveDiscoveredPageKnowledge(
        page: Page,
        discovered: Awaited<ReturnType<ComponentDiscoveryService["discover"]>>,
        existingPage: PageKnowledge | undefined
    ): Promise<void> {
        const now = new Date();
        const pageTitle = await page.title().catch(() => page.url());
        const allComponents = [
            ...discovered.buttons,
            ...discovered.links,
            ...discovered.inputs,
            ...discovered.dropdowns,
            ...discovered.forms,
            ...discovered.tables,
            ...discovered.dialogs
        ];

        const locators = this.unique([
            ...allComponents.map(component => component.selector),
            ...allComponents.flatMap(component => (component.candidateLocators ?? []).map(candidate => candidate.value)),
            ...allComponents.flatMap(component => (component.fallbackLocators ?? []).map(candidate => candidate.value))
        ]);

        const pageKnowledge: PageKnowledge = {
            id: existingPage?.id ?? randomUUID(),
            title: existingPage?.title ?? pageTitle,
            url: page.url(),
            buttons: discovered.buttons,
            links: discovered.links,
            inputs: discovered.inputs,
            dropdowns: discovered.dropdowns,
            forms: discovered.forms,
            tables: discovered.tables,
            dialogs: discovered.dialogs,
            navigationTargets: existingPage?.navigationTargets ?? [],
            locators,
            visitedCount: existingPage?.visitedCount ?? 1,
            createdAt: existingPage?.createdAt ?? now,
            updatedAt: now
        };

        this.knowledgeRepository.savePage(pageKnowledge);
    }

    private flattenKnowledgeComponents(pageKnowledge: PageKnowledge | undefined): Component[] {
        if (!pageKnowledge) {
            return [];
        }

        return [
            ...pageKnowledge.buttons,
            ...pageKnowledge.links,
            ...pageKnowledge.inputs,
            ...pageKnowledge.dropdowns,
            ...pageKnowledge.forms,
            ...pageKnowledge.tables,
            ...pageKnowledge.dialogs
        ];
    }

    private usesUniqueLocator(component: Component, locatorValue: string): boolean {
        const candidate = [...(component.candidateLocators ?? []), ...(component.fallbackLocators ?? [])]
            .find(item => item.value === locatorValue);
        return candidate?.isUnique ?? false;
    }

    private stringSimilarity(a: string, b: string): number {
        if (!a || !b) return 0;
        if (a === b) return 1;

        const aTokens = new Set(a.split(/\s+/u));
        const bTokens = new Set(b.split(/\s+/u));
        let intersection = 0;

        for (const token of aTokens) {
            if (bTokens.has(token)) {
                intersection += 1;
            }
        }

        const union = new Set([...aTokens, ...bTokens]).size;
        return union === 0 ? 0 : intersection / union;
    }

    private includesAny(text: string, terms: string[]): boolean {
        return terms.some(term => {
            const expression = new RegExp(`\\b${this.escapeRegex(term)}\\b`, "u");
            return expression.test(text);
        });
    }

    private normalize(value: string): string {
        return value.replace(/\s+/gu, " ").trim();
    }

    private isNthSelector(locator: string): boolean {
        return /:nth-child\(|:nth-of-type\(/iu.test(locator);
    }

    private unique(values: string[]): string[] {
        return [...new Set(values.filter(Boolean))];
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}

export const stepResolverService = new StepResolverService();
