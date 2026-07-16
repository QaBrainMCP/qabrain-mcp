import { knowledgeEngineService } from "../services/knowledge-engine.service.js";

export interface LearnApplicationInput {
    application: string;
}

export async function learnApplication(input: LearnApplicationInput) {
    return knowledgeEngineService.learn(input.application);
}
