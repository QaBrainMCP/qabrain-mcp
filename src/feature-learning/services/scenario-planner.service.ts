import { ExecutionPlan } from "../models/execution-plan.model.js";
import { ExecutionActionType, ExecutionStep } from "../models/execution-step.model.js";
import { FeatureModel } from "../models/feature.model.js";
import { FeatureStep } from "../models/feature-step.model.js";
import { ScenarioModel } from "../models/scenario.model.js";

const NAVIGATE_TERMS = ["open", "navigate", "go to", "visit"];
const INPUT_TERMS = ["enter", "type", "fill", "input", "select"];
const CLICK_TERMS = ["click", "press", "submit", "save"];
const VERIFY_TERMS = ["verify", "should see", "should display", "should contain", "should be"];

export class ScenarioPlannerService {
    planScenario(feature: FeatureModel, scenario: ScenarioModel): ExecutionPlan {
        const mergedSteps = [...feature.background, ...scenario.steps];
        const executionSteps = mergedSteps.map((step, index) => this.toExecutionStep(step, index + 1));

        return {
            featureName: feature.name,
            scenarioName: scenario.name,
            executionSteps,
            estimatedStepCount: executionSteps.length,
            createdAt: new Date().toISOString()
        };
    }

    planFeature(feature: FeatureModel): ExecutionPlan[] {
        return feature.scenarios.map(scenario => this.planScenario(feature, scenario));
    }

    private toExecutionStep(step: FeatureStep, order: number): ExecutionStep {
        const actionType = this.detectActionType(step.text);

        return {
            order,
            keyword: step.keyword,
            originalStep: step,
            actionType,
            target: this.detectTarget(step.text, actionType),
            value: this.detectValue(step),
            expectedState: this.detectExpectedState(step.text, actionType),
            requiresNavigation: actionType === "NAVIGATE",
            requiresDiscovery: true,
            requiresLocatorValidation: true
        };
    }

    private detectActionType(text: string): ExecutionActionType {
        const normalized = text.toLowerCase();

        if (this.includesAny(normalized, NAVIGATE_TERMS)) {
            return "NAVIGATE";
        }
        if (this.includesAny(normalized, INPUT_TERMS)) {
            return "INPUT";
        }
        if (this.includesAny(normalized, CLICK_TERMS)) {
            return "CLICK";
        }
        if (this.includesAny(normalized, VERIFY_TERMS)) {
            return "VERIFY";
        }

        return "CUSTOM";
    }

    private detectTarget(text: string, actionType: ExecutionActionType): string | null {
        const normalized = this.normalizeText(text);

        switch (actionType) {
            case "NAVIGATE":
                return this.captureAfterVerb(normalized, NAVIGATE_TERMS);
            case "INPUT":
                return this.captureInputTarget(normalized);
            case "CLICK":
                return this.captureAfterVerb(normalized, CLICK_TERMS);
            case "VERIFY":
                return this.captureAfterVerb(normalized, VERIFY_TERMS);
            default:
                return null;
        }
    }

    private detectValue(step: FeatureStep): string | null {
        if (step.variables.length > 0) {
            return step.variables[0] ?? null;
        }

        const normalized = this.normalizeText(step.text);
        const valueMatch = /\b(?:as|with|to)\s+(.+)$/iu.exec(normalized);
        return valueMatch?.[1]?.trim() ?? null;
    }

    private detectExpectedState(text: string, actionType: ExecutionActionType): string | null {
        if (actionType !== "VERIFY") {
            return null;
        }

        const normalized = this.normalizeText(text);
        return this.captureAfterVerb(normalized, VERIFY_TERMS) ?? normalized;
    }

    private captureInputTarget(text: string): string | null {
        const withoutVariable = text
            .replace(/"[^"]*"/gu, "")
            .replace(/'[^']*'/gu, "")
            .replace(/<[^>]+>/gu, "")
            .trim();

        const direct = this.captureAfterVerb(withoutVariable, INPUT_TERMS);
        if (!direct) {
            return null;
        }

        return direct
            .replace(/\b(?:as|with|to)\b.*$/iu, "")
            .replace(/\binto\b.*$/iu, "")
            .trim() || null;
    }

    private captureAfterVerb(text: string, verbs: string[]): string | null {
        for (const verb of verbs) {
            const escapedVerb = this.escapeRegex(verb);
            const pattern = new RegExp(`\\b${escapedVerb}\\b\\s+(.+)$`, "iu");
            const match = pattern.exec(text);
            if (match?.[1]?.trim()) {
                return match[1].trim();
            }
        }
        return null;
    }

    private includesAny(text: string, terms: string[]): boolean {
        return terms.some(term => {
            const escapedTerm = this.escapeRegex(term.toLowerCase());
            const pattern = new RegExp(`\\b${escapedTerm}\\b`, "u");
            return pattern.test(text);
        });
    }

    private normalizeText(text: string): string {
        return text.replace(/\s+/gu, " ").trim();
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}

export const scenarioPlannerService = new ScenarioPlannerService();
