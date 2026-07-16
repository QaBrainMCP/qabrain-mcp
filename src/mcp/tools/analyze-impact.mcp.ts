import { AnalyzeImpactInput, analyzeImpact } from "../../impact/tools/analyze-impact.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const AnalyzeImpactTool: MCPTool<AnalyzeImpactInput> = {
    name: "analyze_impact",
    description: "Analyze the QA intelligence impact of a changed page, component, or locator.",
    async execute(args: AnalyzeImpactInput) {
        return analyzeImpact(args);
    }
};
