import { FeatureStep } from "./feature-step.model.js";

export type ScenarioType = "Scenario" | "Scenario Outline";

export interface ScenarioComment {
    text: string;
    lineNumber: number;
    section: "scenario" | "examples";
}

export interface ScenarioExamples {
    lineNumber: number;
    headers: string[];
    rows: string[][];
    rowLineNumbers: number[];
}

export interface ScenarioModel {
    name: string;
    tags: string[];
    steps: FeatureStep[];
    type?: ScenarioType;
    lineNumber?: number;
    examples?: ScenarioExamples[];
    comments?: ScenarioComment[];
}
