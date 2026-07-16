import { AnalyzeCoverageInput, analyzeCoverage } from "../../coverage/tools/analyze-coverage.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const AnalyzeCoverageTool: MCPTool<AnalyzeCoverageInput> = {
    name: "analyze_coverage",
    description: "Analyze requirement coverage against known QA intelligence.",
    async execute(args: AnalyzeCoverageInput) {
        return analyzeCoverage(args);
    }
};
