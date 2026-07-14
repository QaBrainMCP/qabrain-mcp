import { Step } from "./step.model.js";

export interface Scenario {

    name: string;

    steps: Step[];

}

export interface Requirement {

    id: string;

    title: string;

    description: string;

    scenarios: Scenario[];

}