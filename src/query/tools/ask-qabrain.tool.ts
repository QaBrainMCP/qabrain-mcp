import { queryEngineService } from "../services/query-engine.service.js";

export interface AskQaBrainInput {
    question: string;
}

export async function askQaBrain(input: AskQaBrainInput) {
    return queryEngineService.ask(input.question);
}
