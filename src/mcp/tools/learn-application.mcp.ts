import { LearnApplicationInput, learnApplication } from "../../knowledge/tools/learn-application.tool.js";
import { MCPTool } from "../registry/tool.registry.js";
import { logger } from "../../utils/logger.js";

export const LearnApplicationTool: MCPTool<LearnApplicationInput> = {
    name: "learn_application",
    description: "Learn application pages, components, locators, and navigation relationships.",
    async execute(args: LearnApplicationInput) {
        try {
            logger.info({ application: args.application }, "learn_application tool started");
            const result = await learnApplication(args);
            logger.info({ application: args.application }, "learn_application tool completed");
            return result;
        } catch (error) {
            logger.error({ err: error, application: args.application }, "learn_application tool failed");
            throw error;
        }
    }
};
