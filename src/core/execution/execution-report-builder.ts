import { ExecutionStepResult } from "./execution-step-result.js";
import { ExecutionSummary } from "./execution-summary.js";

export class ExecutionReportBuilder {
    private steps: ExecutionStepResult[] = [];

    addStep(step: ExecutionStepResult): void {
        // steps are immutable after added
        this.steps.push(Object.freeze({ ...step }));
    }

    buildSummary(): ExecutionSummary {
        const pages = new Set<string>();
        let componentsLearned = 0;
        let validatedComponents = 0;
        let validatedLocators = 0;
        let missingComponents = 0;
        let duplicateRemoved = 0;
        let newComponents = 0;
        let updatedComponents = 0;
        let totalTime = 0;

        const validatedSet = new Set<string>();
        const discoveredSet = new Set<string>();

        for (const s of this.steps) {
            totalTime += s.executionTime;
            for (const d of s.discoveredComponents) discoveredSet.add(d.toLowerCase());
            for (const v of s.validatedComponents) validatedSet.add(v.toLowerCase());
            validatedComponents += s.validatedComponents.length;
            validatedLocators += s.generatedLocators.length;
            missingComponents += s.missingComponents.length;
            newComponents += s.knowledgeUpdates?.newComponents ?? 0;
            updatedComponents += s.knowledgeUpdates?.updatedComponents ?? 0;
        }

        // duplicates removed = discovered - unique discovered
        // (we don't have raw count here; approximate as 0)
        duplicateRemoved = 0;

        componentsLearned = discoveredSet.size;

        const coverage = validatedSet.size === 0 && discoveredSet.size === 0 ? 100 : Math.round((validatedSet.size / Math.max(1, discoveredSet.size)) * 100);

        return {
            pagesLearned: pages.size,
            componentsLearned,
            validatedComponents: validatedSet.size,
            validatedLocators,
            missingComponents,
            duplicateComponentsRemoved: duplicateRemoved,
            knowledgeUpdates: { newComponents, updatedComponents },
            executionTime: totalTime,
            coverage
        };
    }

    buildResult(feature: string, scenario: string): { feature: string; scenario: string; totalSteps: number; stepResults: ExecutionStepResult[]; summary: ExecutionSummary } {
        const summary = this.buildSummary();
        return {
            feature,
            scenario,
            totalSteps: this.steps.length,
            stepResults: this.steps,
            summary
        };
    }
}

export default ExecutionReportBuilder;
