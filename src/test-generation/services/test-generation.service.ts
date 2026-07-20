import { Snapshot } from "../../snapshot/models/snapshot.model.js";
import { SnapshotPage } from "../../snapshot/models/snapshot-page.model.js";
import { TestScenario } from "../models/test-scenario.model.js";
import { TestStep } from "../models/test-step.model.js";

interface LocatorCandidate {
    componentName?: string;
    value: string;
}

export class TestGenerationService {
    generateScenarios(snapshot: Snapshot): TestScenario[] {
        const scenarios: TestScenario[] = [];
        let sequence = 1;

        for (const page of snapshot.pages) {
            const pageComponents = page.components.map(component => this.componentName(component));
            const parsedLocators = page.locators.map(locator => this.parseLocator(locator));
            const hasForms = this.hasForms(page);
            const hasTables = this.hasTables(page);

            scenarios.push(
                this.buildScenario({
                    id: this.scenarioId(snapshot.id, sequence++),
                    title: `${page.title} happy path workflow`,
                    priority: "high",
                    feature: page.title,
                    tags: ["happy-path", "page", "deterministic"],
                    preconditions: [
                        "User is authenticated",
                        `User is on ${page.title}`
                    ],
                    testSteps: this.happyPathSteps(page, pageComponents, parsedLocators),
                    expectedResults: [
                        `${page.title} renders successfully`,
                        "Primary components are interactable"
                    ],
                    relatedComponents: this.takeTop(pageComponents, 5),
                    relatedPages: [page.url]
                })
            );

            scenarios.push(
                this.buildScenario({
                    id: this.scenarioId(snapshot.id, sequence++),
                    title: `${page.title} navigation validation`,
                    priority: "medium",
                    feature: page.title,
                    tags: ["navigation", "routing", "deterministic"],
                    preconditions: [
                        "User is authenticated",
                        `User can access ${page.title}`
                    ],
                    testSteps: this.navigationSteps(page, parsedLocators),
                    expectedResults: [
                        "Navigation routes are reachable",
                        "Target pages load without errors"
                    ],
                    relatedComponents: this.takeTop(pageComponents, 3),
                    relatedPages: [page.url, ...this.takeTop(page.navigationTargets, 5)]
                })
            );

            if (hasForms) {
                scenarios.push(
                    this.buildScenario({
                        id: this.scenarioId(snapshot.id, sequence++),
                        title: `${page.title} form validation`,
                        priority: "high",
                        feature: page.title,
                        tags: ["validation", "forms", "deterministic"],
                        preconditions: [
                            "Validation rules are configured",
                            "Form fields are visible"
                        ],
                        testSteps: this.formValidationSteps(page, pageComponents, parsedLocators),
                        expectedResults: [
                            "Validation messages appear for invalid input",
                            "Valid input can be submitted"
                        ],
                        relatedComponents: this.formComponents(pageComponents),
                        relatedPages: [page.url]
                    })
                );

                scenarios.push(
                    this.buildScenario({
                        id: this.scenarioId(snapshot.id, sequence++),
                        title: `${page.title} boundary input checks`,
                        priority: "medium",
                        feature: page.title,
                        tags: ["boundary", "validation", "deterministic"],
                        preconditions: [
                            "Boundary constraints are known",
                            "Form fields accept user input"
                        ],
                        testSteps: this.boundarySteps(page, pageComponents, parsedLocators),
                        expectedResults: [
                            "Boundary values are handled correctly",
                            "No unexpected validation bypass occurs"
                        ],
                        relatedComponents: this.formComponents(pageComponents),
                        relatedPages: [page.url]
                    })
                );

                scenarios.push(
                    this.buildScenario({
                        id: this.scenarioId(snapshot.id, sequence++),
                        title: `${page.title} negative input handling`,
                        priority: "medium",
                        feature: page.title,
                        tags: ["negative", "validation", "deterministic"],
                        preconditions: [
                            "Form is accessible",
                            "User has permission to submit"
                        ],
                        testSteps: this.negativeSteps(page, pageComponents, parsedLocators),
                        expectedResults: [
                            "Invalid submissions are rejected",
                            "System remains stable after invalid actions"
                        ],
                        relatedComponents: this.formComponents(pageComponents),
                        relatedPages: [page.url]
                    })
                );
            }

            if (hasTables) {
                scenarios.push(
                    this.buildScenario({
                        id: this.scenarioId(snapshot.id, sequence++),
                        title: `${page.title} CRUD operations`,
                        priority: "high",
                        feature: page.title,
                        tags: ["crud", "table", "deterministic"],
                        preconditions: [
                            "Page data source is available",
                            "User has create/update/delete permissions"
                        ],
                        testSteps: this.crudSteps(page, pageComponents, parsedLocators),
                        expectedResults: [
                            "Records can be created, updated, and deleted",
                            "Table state remains consistent after operations"
                        ],
                        relatedComponents: this.tableComponents(pageComponents),
                        relatedPages: [page.url]
                    })
                );
            }
        }

        return scenarios;
    }

    exportJson(scenarios: TestScenario[]): string {
        return JSON.stringify(scenarios, null, 2);
    }

    exportMarkdown(scenarios: TestScenario[]): string {
        const sections: string[] = ["# Generated Test Scenarios", ""];

        for (const scenario of scenarios) {
            sections.push(`## ${scenario.title}`);
            sections.push(`- ID: ${scenario.id}`);
            sections.push(`- Priority: ${scenario.priority}`);
            sections.push(`- Feature: ${scenario.feature}`);
            sections.push(`- Tags: ${scenario.tags.join(", ")}`);
            sections.push("- Preconditions:");
            for (const precondition of scenario.preconditions) {
                sections.push(`  - ${precondition}`);
            }

            sections.push("- Steps:");
            scenario.testSteps.forEach((step, index) => {
                sections.push(`  ${index + 1}. ${step.action} on ${step.component} using ${step.locator}`);
                sections.push(`     - Expected: ${step.expectedResult}`);
            });

            sections.push("- Expected Results:");
            for (const result of scenario.expectedResults) {
                sections.push(`  - ${result}`);
            }

            sections.push(`- Related Components: ${scenario.relatedComponents.join(", ") || "none"}`);
            sections.push(`- Related Pages: ${scenario.relatedPages.join(", ") || "none"}`);
            sections.push("");
        }

        return sections.join("\n");
    }

    exportGherkin(scenarios: TestScenario[]): string {
        const lines: string[] = [];

        for (const scenario of scenarios) {
            lines.push(`Feature: ${scenario.feature}`);
            lines.push("");
            lines.push(`  Scenario: ${scenario.title}`);
            for (const precondition of scenario.preconditions) {
                lines.push(`    Given ${precondition}`);
            }

            scenario.testSteps.forEach((step, index) => {
                if (index === 0) {
                    lines.push(`    When ${step.action} on ${step.component}`);
                } else {
                    lines.push(`    And ${step.action} on ${step.component}`);
                }
                lines.push(`    Then ${step.expectedResult}`);
            });

            for (const expected of scenario.expectedResults) {
                lines.push(`    And ${expected}`);
            }

            lines.push("");
        }

        return lines.join("\n");
    }

    private buildScenario(scenario: TestScenario): TestScenario {
        return scenario;
    }

    private happyPathSteps(
        page: SnapshotPage,
        components: string[],
        locators: LocatorCandidate[]
    ): TestStep[] {
        const primary = this.takeTop(components, 3);

        const steps: TestStep[] = primary.map(component => ({
            action: "Interact",
            component,
            locator: this.locatorFor(component, locators),
            expectedResult: `${component} is actionable`
        }));

        return [
            {
                action: "Open page",
                component: page.title,
                locator: page.url,
                expectedResult: `${page.title} is displayed`
            },
            ...steps
        ];
    }

    private navigationSteps(page: SnapshotPage, locators: LocatorCandidate[]): TestStep[] {
        const targets = this.takeTop(page.navigationTargets, 5);
        if (targets.length === 0) {
            return [
                {
                    action: "Verify navigation state",
                    component: page.title,
                    locator: page.url,
                    expectedResult: "Navigation metadata is stable"
                }
            ];
        }

        return targets.map(target => ({
            action: "Navigate",
            component: target,
            locator: this.locatorFor(target, locators),
            expectedResult: `${target} route is reachable`
        }));
    }

    private formValidationSteps(
        page: SnapshotPage,
        components: string[],
        locators: LocatorCandidate[]
    ): TestStep[] {
        const formComponents = this.takeTop(this.formComponents(components), 3);
        return [
            {
                action: "Open form",
                component: page.title,
                locator: page.url,
                expectedResult: "Form is visible"
            },
            ...formComponents.map(component => ({
                action: "Submit empty or invalid value",
                component,
                locator: this.locatorFor(component, locators),
                expectedResult: `${component} shows validation feedback`
            }))
        ];
    }

    private crudSteps(
        page: SnapshotPage,
        components: string[],
        locators: LocatorCandidate[]
    ): TestStep[] {
        const target = this.tableComponents(components)[0] ?? page.title;

        return [
            {
                action: "Create record",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Record is created successfully"
            },
            {
                action: "Update record",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Record changes are persisted"
            },
            {
                action: "Delete record",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Record is removed from the table"
            }
        ];
    }

    private negativeSteps(
        page: SnapshotPage,
        components: string[],
        locators: LocatorCandidate[]
    ): TestStep[] {
        const target = this.formComponents(components)[0] ?? page.title;

        return [
            {
                action: "Submit invalid payload",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Request is rejected with clear error"
            },
            {
                action: "Retry with unauthorized sequence",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Unauthorized operation is blocked"
            }
        ];
    }

    private boundarySteps(
        page: SnapshotPage,
        components: string[],
        locators: LocatorCandidate[]
    ): TestStep[] {
        const target = this.formComponents(components)[0] ?? page.title;

        return [
            {
                action: "Enter minimum boundary value",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Minimum value is accepted or validated as specified"
            },
            {
                action: "Enter maximum boundary value",
                component: target,
                locator: this.locatorFor(target, locators),
                expectedResult: "Maximum value is accepted or validated as specified"
            }
        ];
    }

    private hasForms(page: SnapshotPage): boolean {
        return (
            page.components.some(component => /form|input|dialog/i.test(component)) ||
            page.relationships.some(relationship => /form/i.test(relationship))
        );
    }

    private hasTables(page: SnapshotPage): boolean {
        return (
            page.components.some(component => /table|grid|list/i.test(component)) ||
            page.relationships.some(relationship => /table/i.test(relationship))
        );
    }

    private formComponents(components: string[]): string[] {
        const filtered = components.filter(component => /form|input|dialog/i.test(component));
        return filtered.length > 0 ? filtered : this.takeTop(components, 2);
    }

    private tableComponents(components: string[]): string[] {
        const filtered = components.filter(component => /table|grid|list/i.test(component));
        return filtered.length > 0 ? filtered : this.takeTop(components, 2);
    }

    private parseLocator(locator: string): LocatorCandidate {
        try {
            const parsed = JSON.parse(locator) as Record<string, unknown>;
            if (typeof parsed === "object" && parsed) {
                const value = typeof parsed.value === "string"
                    ? parsed.value
                    : typeof parsed.locator === "string"
                        ? parsed.locator
                        : locator;

                const componentName = typeof parsed.componentName === "string"
                    ? parsed.componentName
                    : typeof parsed.component === "string"
                        ? parsed.component
                        : typeof parsed.name === "string"
                            ? parsed.name
                            : undefined;

                return {
                    componentName,
                    value
                };
            }
        } catch {
            // Raw locator text format.
        }

        return { value: locator };
    }

    private locatorFor(component: string, locators: LocatorCandidate[]): string {
        const byName = locators.find(locator =>
            locator.componentName?.toLowerCase() === component.toLowerCase()
        );
        if (byName) {
            return byName.value;
        }

        const byContains = locators.find(locator =>
            locator.value.toLowerCase().includes(component.toLowerCase())
        );
        if (byContains) {
            return byContains.value;
        }

        return locators[0]?.value ?? "n/a";
    }

    private componentName(componentRaw: string): string {
        try {
            const parsed = JSON.parse(componentRaw) as Record<string, unknown>;
            if (typeof parsed?.name === "string") {
                return parsed.name;
            }
        } catch {
            // Raw component text format.
        }

        const parts = componentRaw.split(":");
        return parts.length > 1 ? parts.slice(1).join(":") : componentRaw;
    }

    private scenarioId(snapshotId: string, sequence: number): string {
        return `${snapshotId}-scenario-${sequence.toString().padStart(3, "0")}`;
    }

    private takeTop(values: string[], max: number): string[] {
        return values.filter(Boolean).slice(0, max);
    }
}

export const testGenerationService = new TestGenerationService();
