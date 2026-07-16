import { RequirementMappingInput } from "../models/requirement-mapping.model.js";
import { requirementMappingService } from "../services/requirement-mapping.service.js";

export async function mapRequirement(input: RequirementMappingInput) {
    return requirementMappingService.map(input.feature);
}
