import { reasoningEngineService } from "../services/reasoning-engine.service.js";

export interface ReasonAboutRequirementInput {
    requirement: string;
}

export async function reasonAboutRequirement(input: ReasonAboutRequirementInput) {
    return reasoningEngineService.reason(input.requirement);
}
