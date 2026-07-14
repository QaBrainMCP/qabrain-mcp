import { Requirement, Scenario } from "../models/requirement.model.js";

export class GherkinParser {

    parse(feature: string): Requirement {

        const lines = feature
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const title =
            lines.find(line => line.startsWith("Feature:"))
                ?.replace("Feature:", "")
                .trim() || "Unknown Feature";

        const scenarios: Scenario[] = [];

        let currentScenario: Scenario | null = null;

        for (const line of lines) {

            if (line.startsWith("Scenario:")) {

                if (currentScenario) {
                    scenarios.push(currentScenario);
                }

                currentScenario = {
                    name: line.replace("Scenario:", "").trim(),
                    steps: []
                };

                continue;
            }

            if (
                line.startsWith("Given") ||
                line.startsWith("When") ||
                line.startsWith("Then") ||
                line.startsWith("And") ||
                line.startsWith("But")
            ) {
                currentScenario?.steps.push(line);
            }

        }

        if (currentScenario) {
            scenarios.push(currentScenario);
        }

        return {
            id: crypto.randomUUID(),
            title,
            description: feature,
            scenarios
        };

    }

}

export const gherkinParser = new GherkinParser();