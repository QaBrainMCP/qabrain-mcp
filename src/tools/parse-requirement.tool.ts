import { requirementService } from "../requirements/services/requirement.service.js";
import { logger } from "../utils/logger.js";

export async function parseRequirement(feature: string) {

    const requirement = requirementService.parse(feature);

    logger.info(requirement, "Requirement Parsed");

    return requirement;

}