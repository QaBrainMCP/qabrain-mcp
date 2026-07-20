import { TestStep } from "./test-step.model.js";

export type TestPriority = "high" | "medium" | "low";

export interface TestScenario {
    id: string;
    title: string;
    priority: TestPriority;
    feature: string;
    tags: string[];
    preconditions: string[];
    testSteps: TestStep[];
    expectedResults: string[];
    relatedComponents: string[];
    relatedPages: string[];
}
