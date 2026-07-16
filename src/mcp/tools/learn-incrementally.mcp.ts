import { LearnIncrementallyInput, learnIncrementally } from "../../versioning/tools/learn-incrementally.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const LearnIncrementallyTool: MCPTool<LearnIncrementallyInput> = {
    name: "learn_incrementally",
    description: "Create a new knowledge version from changes since the prior application snapshot.",
    async execute(args: LearnIncrementallyInput) {
        return learnIncrementally(args);
    }
};
