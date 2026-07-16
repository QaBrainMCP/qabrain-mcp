import { incrementalLearningService } from "../services/incremental-learning.service.js";

export interface LearnIncrementallyInput {
    application: string;
}

export async function learnIncrementally(input: LearnIncrementallyInput) {
    return incrementalLearningService.learn(input.application);
}
