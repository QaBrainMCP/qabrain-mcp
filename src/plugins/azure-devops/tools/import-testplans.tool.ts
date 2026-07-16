import { testCaseService } from "../services/testcase.service.js";

export interface ImportTestPlansInput { project: string; }

export async function importTestPlans(input: ImportTestPlansInput) {
    return testCaseService.importTestPlans(input.project);
}
