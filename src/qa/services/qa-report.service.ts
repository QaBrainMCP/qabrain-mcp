import { qaIntelligence } from "./qa-intelligence.service.js";

export class QAReportService {

    generate(feature: string): string {

        const analysis = qaIntelligence.analyze(feature);

        const output: string[] = [];

        output.push("=====================================");
        output.push("QA Requirement Analysis");
        output.push("=====================================");
        output.push("");

        for (const item of analysis) {

            output.push(`Scenario : ${item.scenario}`);
            output.push(`Step     : ${item.step.keyword} ${item.step.text}`);
            output.push(`Intent   : ${item.intent}`);

            if (item.entities.length > 0) {
                output.push(
                    `Entities : ${item.entities
                        .map(e => `${e.type}(${e.value})`)
                        .join(", ")}`
                );
            } else {
                output.push("Entities : None");
            }

            output.push("");
        }

        return output.join("\n");
    }

}

export const qaReportService = new QAReportService();