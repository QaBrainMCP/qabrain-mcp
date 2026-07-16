import { testCaseService } from "../services/testcase.service.js";

export interface ImportTestCasesInput { project: string; }

export async function importTestCases(input: ImportTestCasesInput) {
    const imported = await testCaseService.importTestPlans(input.project);
    return imported.testCases;
}
