import { ApplicationMemory } from "../application/application.model.js";
import { PageMemory } from "../pages/page.model.js";
import { WorkflowMemory } from "../workflows/workflow.model.js";
import { LocatorMemory } from "../locators/locator.model.js";
import { TestCaseMemory } from "../testcases/testcase.model.js";

export class MemoryRepository {

    private applications: ApplicationMemory[] = [];
    private pages: PageMemory[] = [];
    private workflows: WorkflowMemory[] = [];
    private locators: LocatorMemory[] = [];
    private testCases: TestCaseMemory[] = [];

    // Application
    saveApplication(app: ApplicationMemory) {
        this.applications.push(app);
    }

    getApplications() {
        return this.applications;
    }

    // Page
    savePage(page: PageMemory) {
        this.pages.push(page);
    }

    getPages() {
        return this.pages;
    }

    // Workflow
    saveWorkflow(workflow: WorkflowMemory) {
        this.workflows.push(workflow);
    }

    getWorkflows() {
        return this.workflows;
    }

    // Locator
    saveLocator(locator: LocatorMemory) {
        this.locators.push(locator);
    }

    getLocators() {
        return this.locators;
    }

    // Test Case
    saveTestCase(testCase: TestCaseMemory) {
        this.testCases.push(testCase);
    }

    getTestCases() {
        return this.testCases;
    }
}