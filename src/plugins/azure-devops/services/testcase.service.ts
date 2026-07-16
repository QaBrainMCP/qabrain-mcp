import { AzureClient, azureClient } from "../client/azure.client.js";
import { AzureTestCase } from "../models/testcase.model.js";
import { AzureTestPlan } from "../models/testplan.model.js";
import { AzureTestSuite } from "../models/testsuite.model.js";
import { AzureRepository, azureRepository } from "../repository/azure.repository.js";

export interface AzureTestImport {
    plans: AzureTestPlan[];
    suites: AzureTestSuite[];
    testCases: AzureTestCase[];
}

export class TestCaseService {
    constructor(
        private readonly client: AzureClient = azureClient,
        private readonly repository: AzureRepository = azureRepository
    ) {}

    async importTestPlans(project: string): Promise<AzureTestImport> {
        const plans = (await this.client.listTestPlans(project)).map(plan => ({
            id: plan.id, name: plan.name, state: plan.state ?? "Unknown"
        }));
        const suites = (await Promise.all(plans.map(plan => this.client.listTestSuites(project, plan.id))))
            .flatMap((items, index) => items.map(suite => ({
                id: suite.id, name: suite.name, planId: suite.plan?.id ?? plans[index].id
            })));
        const testCases = (await Promise.all(suites.map(suite =>
            this.client.listTestCases(project, suite.planId, suite.id)
        ))).flatMap(items => items.map(item => ({
            id: item.testCase?.id ?? 0,
            title: item.testCase?.name ?? "Untitled",
            state: "Unknown",
            url: item.testCase?.url ?? ""
        })).filter(testCase => testCase.id > 0));
        this.repository.saveTestPlans(plans);
        this.repository.saveTestSuites(suites);
        this.repository.saveTestCases(testCases);
        return { plans, suites, testCases };
    }

    async importTestResults(project: string) {
        const results = (await this.client.listTestResults(project)).map(result => ({
            id: result.id,
            testCaseId: result.testCase?.id ?? 0,
            outcome: result.outcome ?? "Unknown"
        })).filter(result => result.testCaseId > 0);
        this.repository.saveTestResults(results);
        return results;
    }
}

export const testCaseService = new TestCaseService();
