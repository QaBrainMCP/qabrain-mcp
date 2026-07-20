import { FeatureStep } from "./feature-step.model.js";
import { ScenarioModel } from "./scenario.model.js";

export interface FeatureComment {
    text: string;
    lineNumber: number;
    section: "global" | "feature" | "background" | "scenario" | "examples";
    scenarioName?: string;
}

export interface FeatureModel {
    name: string;
    description: string;
    background: FeatureStep[];
    scenarios: ScenarioModel[];
    comments: FeatureComment[];
}
