import { Step } from "../models/step.model.js";
import { StepIntent } from "../models/step.intent.js";

export class StepAnalyzer {

    analyze(step: Step): StepIntent {

        const text = step.text.toLowerCase();

        if (
            text.includes("open") ||
            text.includes("navigate") ||
            text.includes("go to")
        ) {
            return "NAVIGATION";
        }

        if (
            text.includes("enter") ||
            text.includes("type") ||
            text.includes("fill")
        ) {
            return "INPUT";
        }

        if (
            text.includes("click") ||
            text.includes("press") ||
            text.includes("select")
        ) {
            return "CLICK";
        }

        if (
            text.includes("display") ||
            text.includes("shown") ||
            text.includes("visible") ||
            text.includes("verify") ||
            text.includes("should")
        ) {
            return "VALIDATION";
        }

        return "UNKNOWN";
    }

}

export const stepAnalyzer = new StepAnalyzer();