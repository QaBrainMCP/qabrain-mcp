import { ReasoningResult } from "../models/reasoning.model.js";

export class ReasoningRepository {
    private results: ReasoningResult[] = [];

    save(result: ReasoningResult): ReasoningResult {
        this.results.push(result);
        return result;
    }

    getAll(): ReasoningResult[] {
        return [...this.results];
    }

    clear(): void {
        this.results = [];
    }
}

export const reasoningRepository = new ReasoningRepository();
