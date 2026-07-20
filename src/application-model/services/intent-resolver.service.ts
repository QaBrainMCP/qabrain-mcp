import { BusinessIntent } from "../models/business-intent.js";
import { ExecutionStep } from "../../feature-learning/models/execution-step.model.js";

export class IntentResolverService {
    resolve(step: ExecutionStep): BusinessIntent {
        const target = step.target?.trim() ?? null;
        const text = step.originalStep.text.toLowerCase();

        if (step.actionType === "CLICK" && this.matches(text, target, ["login", "sign in"])) {
            return { type: "LOGIN", target, confidence: 95, reason: "Login command detected" };
        }
        if (step.actionType === "CLICK" && target) {
            return { type: "NAVIGATE_TO_MODULE", target, confidence: 90, reason: "Module click navigation intent" };
        }
        if (step.actionType === "CLICK" && this.matches(text, target, ["save", "submit"])) {
            return { type: "SAVE_FORM", target, confidence: 90, reason: "Save/submit interaction detected" };
        }
        if (step.actionType === "INPUT" && this.matches(text, target, ["search", "find"])) {
            return { type: "SEARCH_EMPLOYEE", target, confidence: 85, reason: "Search intent detected" };
        }
        if (step.actionType === "NAVIGATE") {
            return { type: "NAVIGATE_TO_APPLICATION", target, confidence: 95, reason: "Application navigation step" };
        }
        if (step.actionType === "INPUT") {
            return { type: "INPUT_VALUE", target, confidence: 80, reason: "Input action detected" };
        }
        if (step.actionType === "VERIFY") {
            return { type: "VERIFY_STATE", target, confidence: 80, reason: "Verification action detected" };
        }

        return { type: "CUSTOM_FLOW", target, confidence: 50, reason: "Unknown business flow" };
    }

    private matches(text: string, target: string | null, terms: string[]): boolean {
        const normalizedTarget = target?.toLowerCase() ?? "";
        return terms.some(term => text.includes(term) || normalizedTarget.includes(term));
    }
}

export const intentResolverService = new IntentResolverService();
