import { RequirementMappingInput } from "../../mapping/models/requirement-mapping.model.js";
import { mapRequirement } from "../../mapping/tools/map-requirement.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const MapRequirementTool: MCPTool<RequirementMappingInput> = {
    name: "map_requirement",
    description: "Map a Gherkin requirement to known application pages, workflows, and locators.",
    async execute(args: RequirementMappingInput) {
        return mapRequirement(args);
    }
};
