import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Locator, Page } from "playwright";

import { contextCollectorService } from "../../ai/context/services/context-collector.service.js";
import { contextOptimizerService } from "../../ai/optimizer/services/context-optimizer.service.js";
import { aiDecisionService } from "../../ai/reasoning/services/ai-decision.service.js";
import { actionPlannerService } from "../../ai/reasoning/services/action-planner.service.js";
import { verificationService } from "../../ai/reasoning/services/verification.service.js";
import { ReasoningResult } from "../../ai/reasoning/models/reasoning-result.js";
import { applicationKnowledgeService } from "../../application-model/services/application-knowledge.service.js";
import { executionStrategyService } from "../../application-model/services/execution-strategy.service.js";
import { intentResolverService } from "../../application-model/services/intent-resolver.service.js";
import { pageManager } from "../../browser/page.manager.js";
import { Component } from "../../knowledge/models/component.model.js";
import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { ComponentDiscoveryService, componentDiscoveryService } from "../../knowledge/services/component-discovery.service.js";
import { stepAnalyzerService } from "../../ai/reasoning/step-analyzer.service.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { KnowledgeEngineService, knowledgeEngineService } from "../../knowledge/services/knowledge-engine.service.js";
import { PageKnowledgeService, pageKnowledgeService } from "../../knowledge/services/page-knowledge.service.js";
import { ElementContext } from "../../locator/models/element-context.model.js";
import { LocatorEngineService, locatorEngineService } from "../../locator/services/locator.engine.service.js";
import { SnapshotService } from "../../snapshot/services/snapshot.service.js";
import { logger } from "../../utils/logger.js";
import { ExecutionPlan } from "../models/execution-plan.model.js";
import { ExecutionResult } from "../models/execution-result.model.js";
import { ExecutionStepResult } from "../../core/execution/execution-step-result.js";
import { ExecutionReportBuilder } from "../../core/execution/execution-report-builder.js";
import { ExecutionActionType, ExecutionStep } from "../models/execution-step.model.js";
import { FeatureModel } from "../models/feature.model.js";
import { ScenarioModel } from "../models/scenario.model.js";
import { StepLearningResult } from "../models/step-learning-result.model.js";
import {
    NavigationResolverService,
    navigationResolverService
} from "./navigation-resolver.service.js";
import {
    PageStateAnalyzerService,
    pageStateAnalyzerService
} from "./page-state-analyzer.service.js";
import { ScenarioPlannerService, scenarioPlannerService } from "./scenario-planner.service.js";
import { stepResolverService } from "./step-resolver.service.js";

const STABILITY_TIMEOUT_MS = 60_000;

interface PlaywrightAdapter {
    getPage(): Promise<Page>;
}

interface FlowExecutorOptions {
    captureScreenshots?: boolean;
    screenshotDirectory?: string;
}

interface FlowExecutorDependencies {
    planner?: ScenarioPlannerService;
    knowledgeEngine?: KnowledgeEngineService;
    locatorEngine?: LocatorEngineService;
    snapshotService?: SnapshotService;
    playwrightAdapter?: PlaywrightAdapter;
    knowledgeRepository?: KnowledgeRepository;
    componentDiscovery?: ComponentDiscoveryService;
    pageKnowledge?: PageKnowledgeService;
    navigationResolver?: NavigationResolverService;
    pageStateAnalyzer?: PageStateAnalyzerService;
    now?: () => number;
}

export class FlowExecutorService {
    private readonly planner: ScenarioPlannerService;
    private readonly knowledgeEngine: KnowledgeEngineService;
    private readonly locatorEngine: LocatorEngineService;
    private readonly snapshotService: SnapshotService;
    private readonly playwrightAdapter: PlaywrightAdapter;
    private readonly knowledgeRepository: KnowledgeRepository;
    private readonly componentDiscovery: ComponentDiscoveryService;
    private readonly pageKnowledge: PageKnowledgeService;
    private readonly navigationResolver: NavigationResolverService;
    private readonly pageStateAnalyzer: PageStateAnalyzerService;
    private readonly now: () => number;

    constructor(dependencies: FlowExecutorDependencies = {}) {
        this.planner = dependencies.planner ?? scenarioPlannerService;
        this.knowledgeEngine = dependencies.knowledgeEngine ?? knowledgeEngineService;
        this.locatorEngine = dependencies.locatorEngine ?? locatorEngineService;
        this.snapshotService = dependencies.snapshotService ?? new SnapshotService();
        this.playwrightAdapter = dependencies.playwrightAdapter ?? pageManager;
        this.knowledgeRepository = dependencies.knowledgeRepository ?? knowledgeRepository;
        this.componentDiscovery = dependencies.componentDiscovery ?? componentDiscoveryService;
        this.pageKnowledge = dependencies.pageKnowledge ?? pageKnowledgeService;
        this.navigationResolver = dependencies.navigationResolver ?? navigationResolverService;
        this.pageStateAnalyzer = dependencies.pageStateAnalyzer ?? pageStateAnalyzerService;
        this.now = dependencies.now ?? (() => Date.now());
    }

    async executeScenario(
        feature: FeatureModel,
        scenario: ScenarioModel,
        options: FlowExecutorOptions = {}
    ): Promise<ExecutionResult> {
        const plan = this.planner.planScenario(feature, scenario);
        return this.executePlan(plan, options);
    }

    async executePlan(plan: ExecutionPlan, options: FlowExecutorOptions = {}): Promise<ExecutionResult> {
        const startedAt = this.now();
        const stepResults: StepLearningResult[] = [];
        const reportBuilder = new ExecutionReportBuilder();
        const learnedPages = new Set<string>();
        const learnedComponents = new Set<string>();
        let successfulSteps = 0;
        let failedSteps = 0;
        let validatedLocators = 0;
        let aiCalls = 0;
        let knowledgeOnlyExecutions = 0;

        logger.info(
            {
                feature: plan.featureName,
                scenario: plan.scenarioName,
                totalSteps: plan.executionSteps.length
            },
            "Flow execution started"
        );

        for (const step of plan.executionSteps) {
            const stepStartedAt = this.now();

            try {
                const page = await this.playwrightAdapter.getPage();
                await this.pageStateAnalyzer.prepareForStep(page, step);
                const beforeContext = await contextCollectorService.collect({
                    featureName: plan.featureName,
                    scenarioName: plan.scenarioName,
                    stepNumber: step.order,
                    featureStep: `${step.keyword} ${step.originalStep.text}`,
                    previousStep: step.order > 1
                        ? `${plan.executionSteps[step.order - 2]?.keyword ?? ""} ${plan.executionSteps[step.order - 2]?.originalStep.text ?? ""}`.trim() || null
                        : null,
                    phase: "before",
                    page
                });
                const optimizedContext = contextOptimizerService.optimize(beforeContext);
                const intent = intentResolverService.resolve(step);
                const appModel = applicationKnowledgeService.getModel();
                const currentPageModel = applicationKnowledgeService.getCurrentPage(optimizedContext.currentUrl);
                const strategy = executionStrategyService.build({
                    intent,
                    currentUrl: optimizedContext.currentUrl,
                    currentPage: optimizedContext.pageTitle,
                    step,
                    model: appModel
                });

                const stepValidation = await this.buildStepValidation(step);

                const fallbackReasons: string[] = [];
                const hasKnownNavigation = appModel.navigation.some(edge =>
                    edge.fromPage === optimizedContext.currentUrl &&
                    edge.businessIntent === intent.type &&
                    (intent.target ? edge.viaComponent?.toLowerCase() === intent.target.toLowerCase() : true)
                );

                if (strategy.actions.length === 0) fallbackReasons.push("No strategy exists");
                if (strategy.confidence < 80) fallbackReasons.push("Knowledge confidence < 80%");
                if (!currentPageModel) fallbackReasons.push("Current page unknown");
                if (!hasKnownNavigation && (intent.type === "NAVIGATE_TO_MODULE" || intent.type === "NAVIGATE_TO_APPLICATION")) {
                    fallbackReasons.push("Navigation unknown");
                }
                if (stepValidation.componentFound === "NO" && step.actionType !== "CUSTOM") fallbackReasons.push("Component missing");
                if (!optimizedContext.pageState.readyForInteraction) fallbackReasons.push("Unexpected page state");

                const aiRequired = fallbackReasons.length > 0;

                this.printApplicationKnowledge(
                    optimizedContext.pageTitle,
                    intent.type,
                    appModel.navigation,
                    strategy.actions.map(action => action.description),
                    strategy.confidence,
                    aiRequired,
                    fallbackReasons.join("; ") || "Knowledge path"
                );

                let aiDecision: ReasoningResult["decision"] | null = null;
                let plannedActions: ReasoningResult["plannedActions"] = [];

                if (aiRequired) {
                    aiCalls += 1;
                    console.log("AI Decision Invoked");
                    console.log(`Reason: ${fallbackReasons.join("; ")}`);

                    aiDecision = aiDecisionService.decide(optimizedContext, step);
                    plannedActions = actionPlannerService.plan(aiDecision, optimizedContext, step);
                    this.printAIReasoning(aiDecision, optimizedContext, plannedActions);
                } else {
                    knowledgeOnlyExecutions += 1;
                    plannedActions = strategy.actions.map(action => {
                        if (action.type === "EXPAND_SIDEBAR") {
                            return {
                                type: "EXPAND_SIDEBAR" as const,
                                description: action.description
                            };
                        }
                        if (action.type === "EXECUTE_STEP") {
                            return {
                                type: "EXECUTE_FEATURE_STEP" as const,
                                description: action.description
                            };
                        }
                        return {
                            type: "VERIFY_EXPECTATION" as const,
                            description: action.description
                        };
                    });
                }

                for (const action of plannedActions) {
                    if (action.type === "EXPAND_SIDEBAR") {
                        await this.expandSidebarIfPossible(page);
                    }
                    if (action.type === "EXECUTE_FEATURE_STEP") {
                        await this.executeBusinessAction(step);
                    }
                }

                await this.waitUntilStable();

                const currentPage = await this.playwrightAdapter.getPage();
                const pageUrl = currentPage.url();
                const pageTitle = await currentPage.title();

                const decisionForVerification = aiDecision ?? {
                    currentPage: optimizedContext.pageTitle,
                    businessIntent: intent.type,
                    requiredAction: step.actionType,
                    targetComponent: step.target ?? null,
                    confidence: strategy.confidence,
                    expectedPage: strategy.expectedDestination,
                    expectedComponents: step.target ? [step.target] : [],
                    recoveryActions: [],
                    reasoning: "Knowledge-first strategy execution"
                };

                const verificationResult = await verificationService.verify(
                    currentPage,
                    decisionForVerification
                );

                const afterContext = await contextCollectorService.collect({
                    featureName: plan.featureName,
                    scenarioName: plan.scenarioName,
                    stepNumber: step.order,
                    featureStep: `${step.keyword} ${step.originalStep.text}`,
                    previousStep: step.order > 1
                        ? `${plan.executionSteps[step.order - 2]?.keyword ?? ""} ${plan.executionSteps[step.order - 2]?.originalStep.text ?? ""}`.trim() || null
                        : null,
                    phase: "after",
                    page: currentPage
                });

                const stepAnalysis = stepAnalyzerService.analyze(step, optimizedContext, pageUrl);

                // Try to reuse components from persistent store when available
                let discovered;
                let reusedFromStore = false;
                const targetName = step.target ?? stepValidation.resolvedComponent;
                if (targetName) {
                    const matches = knowledgeStoreService.searchComponents(targetName);
                    if (matches.length > 0) {
                        const good = matches.find(m => (m.confidence ?? 0) >= 80) ?? matches[0];
                        if (good) {
                            // build a simplified discovered structure from stored component(s)
                            const locs = knowledgeStoreService.getLocatorsForComponent(good.componentId);
                            const selector = (locs.find(l => l.isPrimary)?.locator) ?? (locs[0]?.locator) ?? "";
                            const comp: Component = {
                                id: good.componentId,
                                name: good.businessName ?? good.automationName ?? good.normalizedName ?? "",
                                selector,
                                type: good.componentType ?? "unknown"
                            } as unknown as Component;

                            const emptySet = { buttons: [], links: [], inputs: [], dropdowns: [], forms: [], tables: [], dialogs: [] } as any;
                            const place = (good.componentType ?? "").toLowerCase();
                            switch (place) {
                                case "button":
                                case "buttons":
                                    emptySet.buttons.push(comp);
                                    break;
                                case "link":
                                case "links":
                                    emptySet.links.push(comp);
                                    break;
                                case "input":
                                case "textbox":
                                    emptySet.inputs.push(comp);
                                    break;
                                case "dropdown":
                                    emptySet.dropdowns.push(comp);
                                    break;
                                case "form":
                                    emptySet.forms.push(comp);
                                    break;
                                case "table":
                                    emptySet.tables.push(comp);
                                    break;
                                case "dialog":
                                    emptySet.dialogs.push(comp);
                                    break;
                                default:
                                    emptySet.links.push(comp);
                            }

                            discovered = emptySet;
                            reusedFromStore = true;
                            console.log("Component Reused: ", good.componentId);
                            if (selector) console.log("Locator Reused");
                        }
                    }
                }

                if (!reusedFromStore) {
                    const raw = await this.componentDiscovery.discover(currentPage, stepAnalysis);
                    discovered = raw;
                }
                // Report coverage for expected components
                const expected = stepAnalysis.expectedComponents ?? [];
                const discoveredNames = this.flattenComponents(discovered).map(c => c.name?.toLowerCase() ?? "");
                let expectedFound = 0;
                for (const exp of expected) {
                    if (discoveredNames.some(n => n.includes(exp.toLowerCase()))) expectedFound += 1;
                }
                const coverage = expected.length > 0 ? Math.round((expectedFound / expected.length) * 100) : 100;
                console.log("---------- STEP REQUIREMENT REPORT ----------");
                console.log(`Business Intent: ${stepAnalysis.businessIntent}`);
                console.log(`Target Component: ${stepAnalysis.targetComponent ?? '<none>'}`);
                console.log(`Expected Components: ${expected.join(", ") || '<none>'}`);
                console.log(`Ignored Components: ${(stepAnalysis.ignoredComponents || []).join(", ") || '<none>'}`);
                console.log(`Coverage: ${coverage}% (${expectedFound}/${expected.length || 0})`);
                console.log("--------------------------------------------");
                const allComponents = this.flattenComponents(discovered);

                const stepValidatedLocators = await this.validateGeneratedLocators(currentPage, allComponents);

                const previousPage = this.knowledgeRepository.getPageByUrl(pageUrl);
                const beforeSignatures = new Set(this.componentSignatures(previousPage?.buttons ?? [], "button"));
                this.componentSignatures(previousPage?.links ?? [], "link").forEach(signature => beforeSignatures.add(signature));
                this.componentSignatures(previousPage?.inputs ?? [], "input").forEach(signature => beforeSignatures.add(signature));
                this.componentSignatures(previousPage?.dropdowns ?? [], "dropdown").forEach(signature => beforeSignatures.add(signature));
                this.componentSignatures(previousPage?.forms ?? [], "form").forEach(signature => beforeSignatures.add(signature));
                this.componentSignatures(previousPage?.tables ?? [], "table").forEach(signature => beforeSignatures.add(signature));
                this.componentSignatures(previousPage?.dialogs ?? [], "dialog").forEach(signature => beforeSignatures.add(signature));

                const pageLocators = this.collectLocators(allComponents);
                const pageKnowledge = await this.pageKnowledge.create(currentPage, discovered, pageLocators);
                this.knowledgeRepository.savePage(pageKnowledge);

                const afterSignatures = new Set(this.componentSignatures(allComponents));
                let newComponents = 0;
                let updatedComponents = 0;

                for (const signature of afterSignatures) {
                    if (beforeSignatures.has(signature)) {
                        updatedComponents += 1;
                    } else {
                        newComponents += 1;
                    }
                    learnedComponents.add(signature);
                }

                const screenshotPath = await this.captureStepScreenshot(
                    currentPage,
                    plan,
                    step,
                    options.captureScreenshots === true,
                    options.screenshotDirectory
                );

                successfulSteps += 1;
                validatedLocators += stepValidatedLocators;
                learnedPages.add(pageUrl);

                const stepResult: StepLearningResult = {
                    stepNumber: step.order,
                    stepText: `${step.keyword} ${step.originalStep.text}`,
                    pageTitle,
                    pageUrl,
                    discoveredComponents: allComponents.length,
                    validatedLocators: stepValidatedLocators,
                    newComponents,
                    updatedComponents,
                    executionTime: this.now() - stepStartedAt,
                    resolvedComponent: stepValidation.resolvedComponent,
                    componentFound: stepValidation.componentFound,
                    generatedLocator: stepValidation.generatedLocator,
                    validationStatus: stepValidation.validationStatus,
                    confidence: stepValidation.confidence,
                    alternativeLocators: stepValidation.alternativeLocators,
                    businessIntent: intent.type,
                    executionStrategy: strategy.actions.map(action => action.description),
                    strategyConfidence: strategy.confidence,
                    aiRequired,
                    aiReason: aiRequired ? fallbackReasons.join("; ") : "Knowledge path",
                    beforeContext,
                    afterContext,
                    reasoningResult: aiDecision
                        ? {
                            decision: aiDecision,
                            plannedActions,
                            verification: verificationResult
                        }
                        : undefined,
                    screenshotPath
                };

                    stepResults.push(stepResult);

                    // Build ExecutionStepResult immutable record
                    const exeStep: ExecutionStepResult = {
                        stepNumber: step.order,
                        featureStep: `${step.keyword} ${step.originalStep.text}`,
                        businessIntent: intent.type,
                        actionType: step.actionType,
                        pageState: optimizedContext.pageState,
                        discoveryProfile: stepAnalysis?.actionType ?? null,
                        expectedComponents: stepAnalysis?.expectedComponents ?? [],
                        discoveredComponents: allComponents.map(c => c.name ?? "").filter(Boolean),
                        validatedComponents: allComponents.filter(c => stepValidatedLocators && c.selector).map(c => c.name ?? "").filter(Boolean),
                        missingComponents: expected.filter(exp => !discoveredNames.some(n => n.includes(exp.toLowerCase()))),
                        generatedLocators: this.collectLocators(allComponents),
                        knowledgeUpdates: { newComponents, updatedComponents },
                        executionStatus: "SUCCESS",
                        confidence: stepValidation.confidence ?? 0,
                        executionTime: this.now() - stepStartedAt,
                        discoveryFallback: { occurred: false }
                    };

                    // if focused discovery had no results but expected existed, mark fallback flag
                    if ((stepAnalysis?.expectedComponents ?? []).length > 0 && (exeStep.discoveredComponents.length === 0)) {
                        exeStep.discoveryFallback = { occurred: true, reason: "Focused discovery returned no results" };
                        console.log("Focused discovery failed. Fallback enabled. Reason: focused discovery returned no results");
                    }

                    reportBuilder.addStep(exeStep);

                this.captureSnapshotSafe(plan.featureName);

                const previousStepResult = stepResults[stepResults.length - 2];
                if (previousStepResult) {
                    applicationKnowledgeService.learnNavigation({
                        fromPage: previousStepResult.pageUrl,
                        toPage: pageUrl,
                        viaComponent: step.target,
                        businessIntent: intent.type,
                        expectedDestination: strategy.expectedDestination
                    });
                }

                logger.info(
                    {
                        step: step.order,
                        actionType: step.actionType,
                        pageUrl,
                        discoveredComponents: allComponents.length,
                        validatedLocators: stepValidatedLocators
                    },
                    "Flow step completed"
                );
            } catch (error) {
                failedSteps += 1;

                logger.warn(
                    {
                        err: error,
                        step: step.order,
                        actionType: step.actionType
                    },
                    "Flow step failed"
                );

                if (!this.isRecoverableFailure(step, error)) {
                    logger.error(
                        {
                            step: step.order,
                            actionType: step.actionType
                        },
                        "Flow execution stopped due to unrecoverable failure"
                    );
                    break;
                }
            }
        }

        // Build consolidated result from report builder
        const final = reportBuilder.buildResult(plan.featureName, plan.scenarioName);

        return {
            feature: final.feature,
            scenario: final.scenario,
            totalSteps: final.totalSteps,
            successfulSteps,
            failedSteps,
            learnedPages: learnedPages.size,
            learnedComponents: learnedComponents.size,
            validatedLocators,
            aiCalls,
            knowledgeOnlyExecutions,
            executionDuration: this.now() - startedAt,
            stepResults,
            // attach summary for backward compatibility
            summary: final.summary
        } as unknown as ExecutionResult;
    }

    private printApplicationKnowledge(
        currentPage: string,
        businessIntent: string,
        knownNavigation: Array<{ fromPage: string; toPage: string; viaComponent: string | null }>,
        executionStrategy: string[],
        knowledgeConfidence: number,
        aiRequired: boolean,
        reason: string
    ): void {
        console.log("\n========== APPLICATION KNOWLEDGE ==========");
        console.log(`Current Page: ${currentPage}`);
        console.log(`Business Intent: ${businessIntent}`);
        console.log(`Known Navigation: ${knownNavigation.length}`);
        console.log(`Execution Strategy: ${executionStrategy.join(" | ")}`);
        console.log(`Knowledge Confidence: ${knowledgeConfidence}`);
        console.log(`AI Required: ${aiRequired ? "YES" : "NO"}`);
        console.log(`Reason: ${reason}`);
    }

    private async buildStepValidation(step: ExecutionStep): Promise<{
        resolvedComponent: string;
        componentFound: "YES" | "NO";
        generatedLocator: string | null;
        validationStatus: "VALIDATED" | "NOT_VALIDATED" | "CRITICAL";
        confidence: number;
        alternativeLocators: string[];
    }> {
        if (step.actionType === "NAVIGATE") {
            const resolved = this.navigationResolver.resolve(step);
            return {
                resolvedComponent: resolved.resolved
                    ? resolved.applicationName
                    : (step.target ?? "Unknown Application"),
                componentFound: resolved.resolved ? "YES" : "NO",
                generatedLocator: resolved.resolved ? resolved.url : null,
                validationStatus: resolved.resolved ? "VALIDATED" : "NOT_VALIDATED",
                confidence: resolved.resolved ? 100 : 0,
                alternativeLocators: []
            };
        }

        if (step.actionType === "CUSTOM") {
            return {
                resolvedComponent: step.target ?? "Custom Step",
                componentFound: "NO",
                generatedLocator: null,
                validationStatus: "NOT_VALIDATED",
                confidence: 0,
                alternativeLocators: []
            };
        }

        try {
            const resolved = await stepResolverService.resolveExecutionStep(step);
            const componentFound = resolved.matchedComponent ? "YES" : "NO";
            const generatedLocator = resolved.selectedLocator;
            const validationStatus: "VALIDATED" | "NOT_VALIDATED" | "CRITICAL" =
                resolved.matchedComponent && !generatedLocator
                    ? "CRITICAL"
                    : (generatedLocator ? "VALIDATED" : "NOT_VALIDATED");

            return {
                resolvedComponent: resolved.matchedComponent?.name ?? (resolved.target ?? "Unknown Component"),
                componentFound,
                generatedLocator,
                validationStatus,
                confidence: resolved.confidence,
                alternativeLocators: resolved.alternatives.map(item => item.locator)
            };
        } catch {
            return {
                resolvedComponent: step.target ?? "Unknown Component",
                componentFound: "NO",
                generatedLocator: null,
                validationStatus: "NOT_VALIDATED",
                confidence: 0,
                alternativeLocators: []
            };
        }
    }

    private async executeBusinessAction(step: ExecutionStep): Promise<void> {
        const page = await this.playwrightAdapter.getPage();

        switch (step.actionType) {
            case "NAVIGATE":
                await this.executeNavigate(page, step);
                return;
            case "INPUT":
                await this.executeInput(page, step);
                return;
            case "CLICK":
                await this.executeClick(page, step);
                return;
            case "VERIFY":
                await this.executeVerify(page, step);
                return;
            case "CUSTOM":
                logger.info({ step: step.order }, "CUSTOM step skipped gracefully");
                return;
            default:
                logger.info({ step: step.order, actionType: step.actionType }, "Unsupported step type skipped");
        }
    }

    private async executeNavigate(page: Page, step: ExecutionStep): Promise<void> {
        const target = step.target?.trim();
        if (!target) {
            return;
        }

        const resolvedNavigation = this.navigationResolver.resolve(step);
        if (resolvedNavigation.resolved) {
            logger.info({ application: resolvedNavigation.applicationName }, "Resolved Application");
            logger.info({ url: resolvedNavigation.url }, "Resolved URL");
            logger.info({ step: step.order }, "Navigating...");

            await page.goto(resolvedNavigation.url, {
                waitUntil: "domcontentloaded",
                timeout: STABILITY_TIMEOUT_MS
            });

            logger.info({ step: step.order }, "Navigation Successful");
            logger.info({ currentUrl: page.url() }, "Current URL");
            logger.info({ currentPageTitle: await page.title() }, "Current Page Title");
            return;
        }

        const asUrl = this.resolveNavigationUrl(target, page.url());
        if (asUrl) {
            logger.info({ url: asUrl }, "Resolved URL");
            logger.info({ step: step.order }, "Navigating...");

            await page.goto(asUrl, {
                waitUntil: "domcontentloaded",
                timeout: STABILITY_TIMEOUT_MS
            });

            logger.info({ step: step.order }, "Navigation Successful");
            logger.info({ currentUrl: page.url() }, "Current URL");
            logger.info({ currentPageTitle: await page.title() }, "Current Page Title");
            return;
        }

        const byLink = page.getByRole("link", { name: new RegExp(this.escapeRegex(target), "i") }).first();
        if (await byLink.count() > 0) {
            logger.info({ target }, "Navigating...");
            await byLink.click();
            logger.info({ step: step.order }, "Navigation Successful");
            logger.info({ currentUrl: page.url() }, "Current URL");
            logger.info({ currentPageTitle: await page.title() }, "Current Page Title");
            return;
        }

        throw new Error(`Unable to resolve navigation target '${target}'.`);
    }

    private async expandSidebarIfPossible(page: Page): Promise<void> {
        const candidates: Locator[] = [
            page.locator(".oxd-topbar-header-hamburger").first(),
            page.locator("button[aria-label*='menu' i]").first(),
            page.locator(".oxd-main-menu-search button").first()
        ];

        for (const candidate of candidates) {
            try {
                if (await candidate.count() === 0) {
                    continue;
                }
                if (!await candidate.isVisible()) {
                    continue;
                }
                await candidate.click();
                return;
            } catch {
                continue;
            }
        }
    }

    private async executeInput(page: Page, step: ExecutionStep): Promise<void> {
        const value = step.value ?? "";
        const target = step.target?.trim();

        const candidates: Locator[] = [];
        if (target) {
            const safeTarget = this.escapeCssAttribute(target);
            candidates.push(page.getByLabel(target, { exact: false }).first());
            candidates.push(page.getByPlaceholder(target).first());
            candidates.push(page.locator(`[name=\"${safeTarget}\"],[id=\"${safeTarget}\"]`).first());
            candidates.push(page.getByRole("textbox", { name: new RegExp(this.escapeRegex(target), "i") }).first());
        }
        candidates.push(page.locator("input,textarea").first());

        const field = await this.firstAvailableLocator(candidates);
        if (!field) {
            throw new Error(`Unable to locate input target for step ${step.order}.`);
        }

        await field.fill(value);
    }

    private async executeClick(page: Page, step: ExecutionStep): Promise<void> {
        const target = step.target?.trim();
        if (!target) {
            await page.locator("button,[type='submit']").first().click();
            return;
        }

        const byButton = page.getByRole("button", { name: new RegExp(this.escapeRegex(target), "i") }).first();
        if (await byButton.count() > 0) {
            await byButton.click();
            return;
        }

        const byLink = page.getByRole("link", { name: new RegExp(this.escapeRegex(target), "i") }).first();
        if (await byLink.count() > 0) {
            await byLink.click();
            return;
        }

        const safeTarget = this.escapeCssAttribute(target);
        const byAttribute = page.locator(`[name=\"${safeTarget}\"],[id=\"${safeTarget}\"]`).first();
        if (await byAttribute.count() > 0) {
            await byAttribute.click();
            return;
        }

        await page.getByText(new RegExp(this.escapeRegex(target), "i")).first().click();
    }

    private async executeVerify(page: Page, step: ExecutionStep): Promise<void> {
        const expected = step.expectedState ?? step.target;
        if (!expected) {
            return;
        }

        const visible = page.getByText(new RegExp(this.escapeRegex(expected), "i")).first();
        await visible.waitFor({
            state: "visible",
            timeout: STABILITY_TIMEOUT_MS
        });
    }

    private async waitUntilStable(): Promise<void> {
        const page = await this.playwrightAdapter.getPage();

        await page.waitForLoadState("domcontentloaded", { timeout: STABILITY_TIMEOUT_MS });
        await page.locator("body").first().waitFor({
            state: "visible",
            timeout: STABILITY_TIMEOUT_MS
        });
        await page.waitForLoadState("networkidle", {
            timeout: 5_000
        }).catch(() => undefined);
    }

    private async validateGeneratedLocators(page: Page, components: Component[]): Promise<number> {
        let validatedCount = 0;

        for (const component of components) {
            try {
                const locator = page.locator(component.selector).first();
                const context = this.toElementContext(component);
                await this.locatorEngine.build(page, locator, context, component.selector);
                validatedCount += 1;
            } catch (error) {
                logger.warn(
                    {
                        err: error,
                        selector: component.selector,
                        component: component.name
                    },
                    "Locator validation failed for component"
                );
            }
        }

        return validatedCount;
    }

    private flattenComponents(discovered: Awaited<ReturnType<ComponentDiscoveryService["discover"]>>): Component[] {
        return [
            ...discovered.buttons,
            ...discovered.links,
            ...discovered.inputs,
            ...discovered.dropdowns,
            ...discovered.forms,
            ...discovered.tables,
            ...discovered.dialogs
        ];
    }

    private componentSignatures(components: Component[], overrideType?: string): string[] {
        return components.map(component => `${overrideType ?? component.type}:${component.name}`);
    }

    private collectLocators(components: Component[]): string[] {
        const values = new Set<string>();

        for (const component of components) {
            if (component.selector) {
                values.add(component.selector);
            }
            for (const candidate of component.candidateLocators ?? []) {
                if (candidate.value) {
                    values.add(candidate.value);
                }
            }
            for (const fallback of component.fallbackLocators ?? []) {
                if (fallback.value) {
                    values.add(fallback.value);
                }
            }
        }

        return [...values];
    }

    private toElementContext(component: Component): ElementContext {
        const metadata = component.metadata ?? {};
        return {
            ...metadata,
            ariaLabel: metadata["aria-label"],
            cssPath: component.selector,
            visible: metadata.visible ?? true
        };
    }

    private captureSnapshotSafe(applicationName: string): void {
        try {
            this.snapshotService.createSnapshot(applicationName);
        } catch (error) {
            logger.warn({ err: error, applicationName }, "Snapshot capture skipped for current step");
        }
    }

    private async captureStepScreenshot(
        page: Page,
        plan: ExecutionPlan,
        step: ExecutionStep,
        enabled: boolean,
        screenshotDirectory?: string
    ): Promise<string | undefined> {
        if (!enabled) {
            return undefined;
        }

        const directory = screenshotDirectory ?? path.join("artifacts", "feature-learning");
        await mkdir(directory, { recursive: true });

        const filename = `${this.slug(plan.featureName)}-${this.slug(plan.scenarioName)}-step-${step.order}.png`;
        const screenshotPath = path.join(directory, filename);

        await page.screenshot({ path: screenshotPath, fullPage: true });
        return screenshotPath;
    }

    private isRecoverableFailure(step: ExecutionStep, _error: unknown): boolean {
        return step.actionType === "CUSTOM";
    }

    private resolveNavigationUrl(target: string, currentUrl: string): string | null {
        if (/^https?:\/\//iu.test(target)) {
            return target;
        }

        if (target.startsWith("/")) {
            try {
                if (currentUrl) {
                    return new URL(target, currentUrl).toString();
                }
            } catch {
                return null;
            }
        }

        return null;
    }

    private async firstAvailableLocator(candidates: Locator[]): Promise<Locator | null> {
        for (const locator of candidates) {
            try {
                if (await locator.count() > 0) {
                    return locator;
                }
            } catch {
                continue;
            }
        }
        return null;
    }

    private slug(value: string): string {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "item";
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private escapeCssAttribute(value: string): string {
        return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
    }

    private printAIReasoning(
        decision: ReasoningResult["decision"],
        optimizedContext: ReturnType<typeof contextOptimizerService.optimize>,
        plannedActions: ReasoningResult["plannedActions"]
    ): void {
        console.log("\n========== AI REASONING ==========");
        console.log(`Current Page: ${decision.currentPage}`);
        console.log(`Business Intent: ${decision.businessIntent}`);
        console.log(
            `Page State: ready=${optimizedContext.pageState.readyForInteraction}, sidebarExpanded=${optimizedContext.pageState.sidebarExpanded}, modal=${optimizedContext.pageState.modalOpen}, spinner=${optimizedContext.pageState.loadingSpinner}`
        );
        console.log(`Target Component: ${decision.targetComponent ?? "<none>"}`);
        console.log(`Reasoning: ${decision.reasoning}`);
        console.log(`Planned Actions: ${plannedActions.map(item => item.description).join(" | ")}`);
        console.log(`Expected Result: ${decision.expectedPage ?? (decision.expectedComponents.join(", ") || "State change")}`);
        console.log(`Confidence: ${decision.confidence}`);

        console.log("\n========== STEP CONTEXT ==========");
        console.log(`Current URL: ${optimizedContext.currentUrl}`);
        console.log(`Page: ${optimizedContext.pageTitle}`);
        console.log(`Module: ${optimizedContext.pageState.currentModule ?? "<none>"}`);
        console.log(`Ready: ${optimizedContext.pageState.readyForInteraction}`);
        console.log(`Sidebar Expanded: ${optimizedContext.pageState.sidebarExpanded}`);
        console.log(`Modal: ${optimizedContext.pageState.modalOpen}`);
        console.log(`Spinner: ${optimizedContext.pageState.loadingSpinner}`);
        console.log(`Known Components: ${optimizedContext.knownComponents}`);
        console.log(`Screenshot Path: ${optimizedContext.screenshotPath ?? "<none>"}`);
        console.log(`DOM Size: ${optimizedContext.cleanedDom.length}`);
        console.log(`Accessibility Nodes: ${optimizedContext.interactiveComponentsSummary.visibleInteractiveElements.length}`);
    }
}

export const flowExecutorService = new FlowExecutorService();
