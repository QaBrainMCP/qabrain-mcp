import { LearnApplicationInput, learnApplication } from "../../knowledge/tools/learn-application.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const LearnApplicationTool: MCPTool<LearnApplicationInput> = {
    name: "learn_application",
    description: "Learn application pages, components, locators, and navigation relationships.",
    async execute(args: LearnApplicationInput) {
        return learnApplication(args);
    }
};
