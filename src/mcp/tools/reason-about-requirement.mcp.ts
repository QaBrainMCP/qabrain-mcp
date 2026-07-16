import {
    ReasonAboutRequirementInput,
    reasonAboutRequirement
} from "../../reasoning/tools/reason-about-requirement.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const ReasonAboutRequirementTool: MCPTool<ReasonAboutRequirementInput> = {
    name: "reason_about_requirement",
    description: "Infer QA recommendations and risk from a requirement and remembered knowledge.",
    async execute(args: ReasonAboutRequirementInput) {
        return reasonAboutRequirement(args);
    }
};
