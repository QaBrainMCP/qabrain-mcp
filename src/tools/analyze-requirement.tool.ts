import { qaIntelligence } from "../qa/services/qa-intelligence.service.js";
import { logger } from "../utils/logger.js";

export async function analyzeRequirement(feature: string) {

    const analysis = qaIntelligence.analyze(feature);

    logger.info(analysis, "Requirement Analysis");

    return analysis;

}