import { AskQaBrainInput, askQaBrain } from "../../query/tools/ask-qabrain.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const AskQaBrainTool: MCPTool<AskQaBrainInput> = {
    name: "ask_qabrain",
    description: "Answer a natural-language question using remembered QA knowledge.",
    async execute(args: AskQaBrainInput) {
        return askQaBrain(args);
    }
};
