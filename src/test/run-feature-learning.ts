import path from "node:path";
import { fileURLToPath } from "node:url";

import { featureParserService } from "../feature-learning/services/feature-parser.service.js";
import { scenarioPlannerService } from "../feature-learning/services/scenario-planner.service.js";
import { flowExecutorService } from "../feature-learning/services/flow-executor.service.js";
import { ExecutionStep } from "../feature-learning/models/execution-step.model.js";
import { ScenarioModel } from "../feature-learning/models/scenario.model.js";
import { pageManager } from "../browser/page.manager.js";
import { applicationKnowledgeService } from "../application-model/services/application-knowledge.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PipelineContext {
    featurePath: string;
    featureName: string;
    scenarioName: string;
    snapshotCreated: boolean;
    knowledgeUpdated: boolean;
}

interface ScenarioReportTotals {
    requiredComponents: number;
    missingComponents: number;
    newComponents: number;
    updatedComponents: number;
    aiCalls: number;
    knowledgeOnlyExecutions: number;
}

function printSection(title: string): void {
    console.log(`\n========== ${title} ==========`);
}

function normalizeComponentName(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isRequiredStep(step: ExecutionStep): boolean {
    return step.actionType === "INPUT" || step.actionType === "CLICK" || step.actionType === "VERIFY";
}

function matchesRequired(required: string, resolved: string): boolean {
    const left = normalizeComponentName(required);
    const right = normalizeComponentName(resolved);
    return left === right || left.includes(right) || right.includes(left);
}

function printFailure(
    stage: string,
    error: unknown,
    context: Partial<PipelineContext>,
    failingStep?: string
): void {
    printSection("PIPELINE FAILURE");
    console.error(`Failing Stage: ${stage}`);
    if (failingStep) {
        console.error(`Failing Step: ${failingStep}`);
    }
    if (context.featureName) {
        console.error(`Feature: ${context.featureName}`);
    }
    if (context.scenarioName) {
        console.error(`Scenario: ${context.scenarioName}`);
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error(`Exception: ${errorObj.message}`);
    console.error("Stack Trace:");
    console.error(errorObj.stack ?? "<no stack trace>");

    console.error("Root Cause Analysis:");
    console.error(
        [
            "1. The feature-learning pipeline encountered an unrecoverable runtime error.",
            "2. Validate runtime configuration (APP_URL, APP_USERNAME, APP_PASSWORD) and target app accessibility.",
            "3. Confirm browser can launch in the current environment.",
            "4. Confirm target elements are available and stable for the step being executed."
        ].join("\n")
    );
}

async function executeScenario(
    featureName: string,
    scenario: ScenarioModel,
    context: Partial<PipelineContext>
): Promise<ScenarioReportTotals> {
    context.scenarioName = scenario.name;

    printSection("SCENARIO");
    console.log(scenario.name);

    const executionPlan = scenarioPlannerService.planScenario(
        {
            name: featureName,
            description: "",
            background: [],
            scenarios: [scenario],
            comments: []
        },
        scenario
    );

    printSection("EXECUTION PLAN");
    for (const step of executionPlan.executionSteps) {
        console.log(`Step Number: ${step.order}`);
        console.log(`Keyword: ${step.keyword}`);
        console.log(`Action Type: ${step.actionType}`);
        console.log(`Target: ${step.target ?? "<none>"}`);
        console.log("");
    }

    printSection("EXECUTION");
    const executionResult = await flowExecutorService.executePlan(executionPlan, {
        captureScreenshots: false
    });

    const byOrder = new Map(executionPlan.executionSteps.map(step => [step.order, step]));

    let totalNewComponents = 0;
    let totalUpdatedComponents = 0;
    const requiredComponents = new Map<string, string>();
    const discoveredRequired = new Set<string>();

    for (const step of executionPlan.executionSteps) {
        if (!isRequiredStep(step)) {
            continue;
        }
        const target = step.target?.trim();
        if (!target) {
            continue;
        }
        requiredComponents.set(normalizeComponentName(target), target);
    }

    for (const stepResult of executionResult.stepResults) {
        const plannedStep = byOrder.get(stepResult.stepNumber);
        const originalStep = plannedStep
            ? `${plannedStep.keyword} ${plannedStep.originalStep.text}`
            : stepResult.stepText;
        const requiredTarget = plannedStep?.target?.trim() ?? null;
        const isRequired = plannedStep ? isRequiredStep(plannedStep) : false;
        const requiredList = isRequired && requiredTarget ? [requiredTarget] : [];
        const discoveredList = stepResult.componentFound === "YES" ? [stepResult.resolvedComponent] : [];
        const missingList = requiredList.filter(required =>
            !discoveredList.some(found => matchesRequired(required, found))
        );
        const extraList = discoveredList.filter(found =>
            !requiredList.some(required => matchesRequired(required, found))
        );
        const coverage = requiredList.length === 0
            ? 100
            : Math.round(((requiredList.length - missingList.length) / requiredList.length) * 100);

        if (isRequired && requiredTarget && stepResult.componentFound === "YES" && missingList.length === 0) {
            discoveredRequired.add(normalizeComponentName(requiredTarget));
        }

        totalNewComponents += stepResult.newComponents;
        totalUpdatedComponents += stepResult.updatedComponents;

        console.log(`Step Number: ${stepResult.stepNumber}`);
        console.log(`Original Step: ${originalStep}`);
        console.log(`Resolved Action: ${plannedStep?.actionType ?? "CUSTOM"}`);
        console.log(`Resolved Target: ${plannedStep?.target ?? "<none>"}`);
        console.log(`Current URL: ${stepResult.pageUrl}`);
        console.log(`Current Page Title: ${stepResult.pageTitle}`);
        console.log(`Business Intent: ${stepResult.businessIntent ?? "<none>"}`);
        console.log(`Execution Strategy: ${stepResult.executionStrategy?.join(" | ") ?? "<none>"}`);
        console.log(`Knowledge Confidence: ${stepResult.strategyConfidence ?? 0}`);
        console.log(`AI Required: ${stepResult.aiRequired ? "YES" : "NO"}`);
        console.log(`Reason: ${stepResult.aiReason ?? "<none>"}`);
        console.log("");
        console.log(`Components Discovered: ${stepResult.discoveredComponents}`);
        console.log(`Generated Locators: ${stepResult.validatedLocators}`);
        console.log(`Validated Locators: ${stepResult.validatedLocators}`);
        console.log("");
        console.log(
            `Learning Result: new=${stepResult.newComponents}, updated=${stepResult.updatedComponents}`
        );
        console.log(`Execution Time: ${stepResult.executionTime} ms`);

        printSection("LEARNING VALIDATION REPORT");
        console.log("---------------------------------------");
        console.log(`Feature Step: ${originalStep}`);
        console.log(`Resolved Component: ${stepResult.resolvedComponent}`);
        console.log(`Was Component Found?: ${stepResult.componentFound}`);
        console.log(`Generated Locator: ${stepResult.generatedLocator ?? "<none>"}`);
        console.log(`Validation Status: ${stepResult.validationStatus}`);
        if (stepResult.validationStatus === "CRITICAL") {
            console.log("CRITICAL: Required component exists but no validated locator was generated.");
        }
        console.log(`Confidence: ${stepResult.confidence}`);
        console.log(
            `Alternative Locators: ${stepResult.alternativeLocators.length > 0 ? stepResult.alternativeLocators.join(", ") : "<none>"}`
        );
        console.log("---------------------------------------");

        printSection("FEATURE COVERAGE REPORT");
        console.log(`Step ${stepResult.stepNumber}`);
        console.log(`Required Components: ${requiredList.length > 0 ? requiredList.join(", ") : "<none>"}`);
        console.log(`Discovered Components: ${discoveredList.length > 0 ? discoveredList.join(", ") : "<none>"}`);
        console.log(`Missing Components: ${missingList.length > 0 ? missingList.join(", ") : "<none>"}`);
        console.log(`Extra Components: ${extraList.length > 0 ? extraList.join(", ") : "<none>"}`);
        console.log(`Coverage %: ${coverage}`);
        console.log("---------------------------------------");
        console.log("----------------------------------------");
    }

    const requiredEntries = [...requiredComponents.entries()];
    const missingRequired = requiredEntries
        .filter(([normalized]) => !discoveredRequired.has(normalized))
        .map(([, display]) => display);
    const overallCoverage = requiredEntries.length === 0
        ? 100
        : Math.round(((requiredEntries.length - missingRequired.length) / requiredEntries.length) * 100);

    printSection("FEATURE COVERAGE REPORT");
    console.log("Overall");
    console.log(`Pages Learned: ${executionResult.learnedPages}`);
    console.log(`Components Learned: ${executionResult.learnedComponents}`);
    console.log(`Components Required: ${requiredEntries.length}`);
    console.log(`Components Missing: ${missingRequired.length}`);
    if (missingRequired.length > 0) {
        console.log(`Missing Required Components: ${missingRequired.join(", ")}`);
    }
    console.log(`Coverage %: ${overallCoverage}`);
    console.log("---------------------------------------");

    context.snapshotCreated = executionResult.successfulSteps > 0;
    context.knowledgeUpdated = executionResult.successfulSteps > 0;

    printSection("FINAL SUMMARY");
    console.log(`Feature: ${executionResult.feature}`);
    console.log(`Scenario: ${executionResult.scenario}`);
    console.log(`Pages Learned: ${executionResult.learnedPages}`);
    console.log(`Components Learned: ${executionResult.learnedComponents}`);
    console.log(`Validated Locators: ${executionResult.validatedLocators}`);
    console.log(`New Components: ${totalNewComponents}`);
    console.log(`Updated Components: ${totalUpdatedComponents}`);
    console.log(`Execution Duration: ${executionResult.executionDuration} ms`);
    console.log(`Snapshot Created: ${context.snapshotCreated ? "Yes" : "No"}`);
    console.log(`Knowledge Repository Updated: ${context.knowledgeUpdated ? "Yes" : "No"}`);
    console.log(`AI Calls: ${executionResult.aiCalls}`);
    console.log(`Knowledge-only Executions: ${executionResult.knowledgeOnlyExecutions}`);

    return {
        requiredComponents: requiredEntries.length,
        missingComponents: missingRequired.length,
        newComponents: totalNewComponents,
        updatedComponents: totalUpdatedComponents,
        aiCalls: executionResult.aiCalls,
        knowledgeOnlyExecutions: executionResult.knowledgeOnlyExecutions
    };
}

async function run(): Promise<void> {
    const featurePath = path.resolve(__dirname, "../../test-data/features/login.feature");
    const context: Partial<PipelineContext> = {
        featurePath
    };

    try {
        const feature = await featureParserService.parseFile(featurePath);
        if (feature.scenarios.length === 0) {
            throw new Error("No scenario found in login.feature");
        }

        context.featureName = feature.name;

        printSection("FEATURE");
        console.log(feature.name);

        let totalAiCalls = 0;
        let totalKnowledgeOnlyExecutions = 0;
        let totalRequiredComponents = 0;
        let totalMissingComponents = 0;

        for (const scenario of feature.scenarios) {
            const scenarioWithBackground: ScenarioModel = {
                ...scenario,
                steps: [...feature.background, ...scenario.steps]
            };

            try {
                const totals = await executeScenario(feature.name, scenarioWithBackground, context);
                totalAiCalls += totals.aiCalls;
                totalKnowledgeOnlyExecutions += totals.knowledgeOnlyExecutions;
                totalRequiredComponents += totals.requiredComponents;
                totalMissingComponents += totals.missingComponents;
            } finally {
                await pageManager.closePage();
            }
        }

        const modelSummary = applicationKnowledgeService.summary();
        const navigationGraph = applicationKnowledgeService.navigationGraph();

        printSection("APPLICATION MODEL SUMMARY");
        console.log(`Pages: ${modelSummary.pages}`);
        console.log(`Modules: ${modelSummary.modules}`);
        console.log(`Navigation Edges: ${modelSummary.navigationEdges}`);
        console.log(`Components: ${modelSummary.components}`);

        printSection("LEARNED NAVIGATION GRAPH");
        if (navigationGraph.length === 0) {
            console.log("<none>");
        } else {
            for (const edge of navigationGraph) {
                console.log(`${edge.from} -> ${edge.to} via ${edge.via ?? "<direct>"}`);
            }
        }

        const finalCoverage = totalRequiredComponents === 0
            ? 100
            : Math.round(((totalRequiredComponents - totalMissingComponents) / totalRequiredComponents) * 100);

        printSection("FINAL EXECUTION REPORT");
        console.log(`AI Calls: ${totalAiCalls}`);
        console.log(`Knowledge-only Executions: ${totalKnowledgeOnlyExecutions}`);
        console.log(`Required Components: ${totalRequiredComponents}`);
        console.log(`Missing Components: ${totalMissingComponents}`);
        console.log(`Final Coverage %: ${finalCoverage}`);
    } catch (error) {
        printFailure("Feature Learning Pipeline", error, context);
        process.exitCode = 1;
    }
}

void run();
