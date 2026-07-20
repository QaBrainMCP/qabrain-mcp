import { promises as fs } from "node:fs";

import { FeatureComment, FeatureModel } from "../models/feature.model.js";
import { FeatureStep, FeatureStepKeyword } from "../models/feature-step.model.js";
import { ScenarioExamples, ScenarioModel, ScenarioType } from "../models/scenario.model.js";

export class FeatureParserError extends Error {
    readonly lineNumber: number;
    readonly source: string;

    constructor(message: string, lineNumber: number, source = "inline") {
        super(`${source}:${lineNumber} ${message}`);
        this.name = "FeatureParserError";
        this.lineNumber = lineNumber;
        this.source = source;
    }
}

export class FeatureParserService {
    async parseFile(filePath: string): Promise<FeatureModel> {
        const content = await fs.readFile(filePath, "utf8");
        return this.parse(content, filePath);
    }

    parse(content: string, source = "inline"): FeatureModel {
        const lines = content.split(/\r?\n/);
        let featureName: string | null = null;
        const featureDescriptionLines: string[] = [];
        const background: FeatureStep[] = [];
        const scenarios: ScenarioModel[] = [];
        const comments: FeatureComment[] = [];

        let currentScenario: ScenarioModel | null = null;
        let currentExamples: ScenarioExamples | null = null;
        let pendingTags: string[] = [];
        let inBackground = false;

        for (let index = 0; index < lines.length; index += 1) {
            const lineNumber = index + 1;
            const line = lines[index] ?? "";
            const trimmed = line.trim();

            if (trimmed.length === 0) {
                if (featureName && !inBackground && !currentScenario && featureDescriptionLines.length > 0) {
                    featureDescriptionLines.push("");
                }
                continue;
            }

            if (this.isComment(trimmed)) {
                const section = this.commentSection(featureName, inBackground, currentScenario, currentExamples);
                const text = trimmed.replace(/^#\s?/, "");
                comments.push({
                    text,
                    lineNumber,
                    section,
                    scenarioName: currentScenario?.name
                });

                if (currentScenario) {
                    if (!currentScenario.comments) {
                        currentScenario.comments = [];
                    }
                    currentScenario.comments.push({
                        text,
                        lineNumber,
                        section: currentExamples ? "examples" : "scenario"
                    });
                }
                continue;
            }

            const featureMatch = this.matchSection(trimmed, "Feature");
            if (featureMatch) {
                if (featureName) {
                    throw new FeatureParserError("Multiple Feature declarations are not allowed.", lineNumber, source);
                }

                const name = featureMatch[1]?.trim() ?? "";
                if (!name) {
                    throw new FeatureParserError("Feature name is required after 'Feature:'.", lineNumber, source);
                }

                featureName = name;
                inBackground = false;
                currentScenario = null;
                currentExamples = null;
                continue;
            }

            if (!featureName) {
                const tags = this.parseTags(trimmed);
                if (tags.length > 0 || trimmed === "") {
                    pendingTags = [...pendingTags, ...tags];
                    continue;
                }
                throw new FeatureParserError("Expected 'Feature:' before other content.", lineNumber, source);
            }

            const tags = this.parseTags(trimmed);
            if (tags.length > 0) {
                pendingTags = [...pendingTags, ...tags];
                continue;
            }

            if (this.matchSection(trimmed, "Background")) {
                if (pendingTags.length > 0) {
                    throw new FeatureParserError("Tags can only be attached to a Scenario or Scenario Outline.", lineNumber, source);
                }
                inBackground = true;
                currentScenario = null;
                currentExamples = null;
                continue;
            }

            const scenarioOutlineMatch = this.matchSection(trimmed, "Scenario Outline");
            if (scenarioOutlineMatch) {
                currentScenario = this.createScenario(
                    scenarioOutlineMatch[1],
                    pendingTags,
                    "Scenario Outline",
                    lineNumber
                );
                scenarios.push(currentScenario);
                pendingTags = [];
                inBackground = false;
                currentExamples = null;
                continue;
            }

            const scenarioMatch = this.matchSection(trimmed, "Scenario");
            if (scenarioMatch) {
                currentScenario = this.createScenario(scenarioMatch[1], pendingTags, "Scenario", lineNumber);
                scenarios.push(currentScenario);
                pendingTags = [];
                inBackground = false;
                currentExamples = null;
                continue;
            }

            if (this.matchSection(trimmed, "Examples")) {
                if (!currentScenario || currentScenario.type !== "Scenario Outline") {
                    throw new FeatureParserError(
                        "Examples block must follow a Scenario Outline.",
                        lineNumber,
                        source
                    );
                }
                const examples: ScenarioExamples = {
                    lineNumber,
                    headers: [],
                    rows: [],
                    rowLineNumbers: []
                };
                if (!currentScenario.examples) {
                    currentScenario.examples = [];
                }
                currentScenario.examples.push(examples);
                currentExamples = examples;
                inBackground = false;
                continue;
            }

            if (currentExamples && this.isTableRow(trimmed)) {
                const cells = this.parseTableRow(trimmed);
                if (cells.length === 0) {
                    throw new FeatureParserError("Examples table rows cannot be empty.", lineNumber, source);
                }

                if (currentExamples.headers.length === 0) {
                    currentExamples.headers = cells;
                } else {
                    if (cells.length !== currentExamples.headers.length) {
                        throw new FeatureParserError(
                            `Examples row has ${cells.length} columns but expected ${currentExamples.headers.length}.`,
                            lineNumber,
                            source
                        );
                    }
                    currentExamples.rows.push(cells);
                    currentExamples.rowLineNumbers.push(lineNumber);
                }
                continue;
            }

            const step = this.parseStep(trimmed, lineNumber);
            if (step) {
                currentExamples = null;
                if (inBackground) {
                    background.push(step);
                    continue;
                }

                if (currentScenario) {
                    currentScenario.steps.push(step);
                    continue;
                }

                throw new FeatureParserError(
                    "Step found outside Background/Scenario. Add a Background or Scenario first.",
                    lineNumber,
                    source
                );
            }

            if (!inBackground && !currentScenario) {
                featureDescriptionLines.push(trimmed);
                continue;
            }

            throw new FeatureParserError(
                `Unsupported statement '${trimmed}'.`,
                lineNumber,
                source
            );
        }

        if (!featureName) {
            throw new FeatureParserError("Feature declaration is required.", 1, source);
        }

        if (pendingTags.length > 0) {
            throw new FeatureParserError("Dangling tags were found without a Scenario.", lines.length, source);
        }

        for (const scenario of scenarios) {
            if (scenario.type === "Scenario Outline") {
                const examples = scenario.examples ?? [];
                if (examples.length === 0) {
                    throw new FeatureParserError(
                        `Scenario Outline '${scenario.name}' must include an Examples block.`,
                        scenario.lineNumber ?? 1,
                        source
                    );
                }

                for (const example of examples) {
                    if (example.headers.length === 0) {
                        throw new FeatureParserError(
                            `Examples for '${scenario.name}' must include a header row.`,
                            example.lineNumber,
                            source
                        );
                    }
                }
            }
        }

        return {
            name: featureName,
            description: this.normalizeDescription(featureDescriptionLines),
            background,
            scenarios,
            comments
        };
    }

    private createScenario(
        rawName: string,
        tags: string[],
        type: ScenarioType,
        lineNumber: number
    ): ScenarioModel {
        const name = rawName.trim();
        if (!name) {
            throw new FeatureParserError(`${type} name is required.`, lineNumber);
        }

        return {
            name,
            tags,
            steps: [],
            type,
            lineNumber,
            examples: type === "Scenario Outline" ? [] : undefined,
            comments: []
        };
    }

    private parseStep(line: string, lineNumber: number): FeatureStep | null {
        const match = /^\s*(Given|When|Then|And|But)\s+(.+)$/u.exec(line);
        if (!match) {
            return null;
        }

        const keyword = match[1] as FeatureStepKeyword;
        const text = (match[2] ?? "").trim();
        if (!text) {
            throw new FeatureParserError(`Step text is required after '${keyword}'.`, lineNumber);
        }

        return {
            keyword,
            text,
            lineNumber,
            variables: this.extractVariables(text)
        };
    }

    private parseTags(line: string): string[] {
        if (!/^\s*@/u.test(line)) {
            return [];
        }
        return line
            .trim()
            .split(/\s+/u)
            .filter(token => token.startsWith("@"))
            .map(token => token.slice(1))
            .filter(Boolean);
    }

    private matchSection(line: string, section: string): RegExpExecArray | null {
        const escaped = section.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const expression = new RegExp(`^\\s*${escaped}:\\s*(.*)$`, "iu");
        return expression.exec(line);
    }

    private isComment(line: string): boolean {
        return /^\s*#/u.test(line);
    }

    private isTableRow(line: string): boolean {
        return /^\|.*\|$/u.test(line.trim());
    }

    private parseTableRow(line: string): string[] {
        const trimmed = line.trim().replace(/^\|/u, "").replace(/\|$/u, "");
        return trimmed.split("|").map(cell => cell.trim());
    }

    private extractVariables(text: string): string[] {
        const variables: string[] = [];
        const pattern = /"([^"]*)"|'([^']*)'|<([^>]+)>/gu;
        let match: RegExpExecArray | null = pattern.exec(text);

        while (match) {
            const value = match[1] ?? match[2] ?? match[3];
            if (value !== undefined) {
                variables.push(value);
            }
            match = pattern.exec(text);
        }

        return variables;
    }

    private commentSection(
        featureName: string | null,
        inBackground: boolean,
        currentScenario: ScenarioModel | null,
        currentExamples: ScenarioExamples | null
    ): FeatureComment["section"] {
        if (!featureName) {
            return "global";
        }
        if (currentExamples) {
            return "examples";
        }
        if (inBackground) {
            return "background";
        }
        if (currentScenario) {
            return "scenario";
        }
        return "feature";
    }

    private normalizeDescription(lines: string[]): string {
        const normalized = [...lines];

        while (normalized.length > 0 && normalized[0] === "") {
            normalized.shift();
        }
        while (normalized.length > 0 && normalized[normalized.length - 1] === "") {
            normalized.pop();
        }

        return normalized.join("\n");
    }
}

export const featureParserService = new FeatureParserService();
