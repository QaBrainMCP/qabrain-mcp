import { AzureBug } from "../models/bug.model.js";
import { AzureArea, AzureConnection, AzureIteration, AzureProject, AzureRepositoryArtifact } from "../models/project.model.js";
import { AzureTestCase, AzureTestResult } from "../models/testcase.model.js";
import { AzureTestPlan } from "../models/testplan.model.js";
import { AzureTestSuite } from "../models/testsuite.model.js";
import { AzureWorkItem } from "../models/workitem.model.js";

export class AzureRepository {
    private connection: AzureConnection | null = null;
    private projects: AzureProject[] = [];
    private repositories: AzureRepositoryArtifact[] = [];
    private workItems: AzureWorkItem[] = [];
    private bugs: AzureBug[] = [];
    private testPlans: AzureTestPlan[] = [];
    private testSuites: AzureTestSuite[] = [];
    private testCases: AzureTestCase[] = [];
    private testResults: AzureTestResult[] = [];
    private iterations: AzureIteration[] = [];
    private areas: AzureArea[] = [];

    saveConnection(connection: AzureConnection): AzureConnection {
        this.connection = connection;
        return connection;
    }

    getConnection(): AzureConnection | null {
        return this.connection;
    }

    saveProjects(projects: AzureProject[]): void { this.projects = [...projects]; }
    getProjects(): AzureProject[] { return [...this.projects]; }
    saveRepositories(repositories: AzureRepositoryArtifact[]): void { this.repositories = [...repositories]; }
    getRepositories(): AzureRepositoryArtifact[] { return [...this.repositories]; }
    saveWorkItems(workItems: AzureWorkItem[]): void { this.workItems = [...workItems]; }
    getWorkItems(): AzureWorkItem[] { return [...this.workItems]; }
    saveBugs(bugs: AzureBug[]): void { this.bugs = [...bugs]; }
    getBugs(): AzureBug[] { return [...this.bugs]; }
    saveTestPlans(plans: AzureTestPlan[]): void { this.testPlans = [...plans]; }
    getTestPlans(): AzureTestPlan[] { return [...this.testPlans]; }
    saveTestSuites(suites: AzureTestSuite[]): void { this.testSuites = [...suites]; }
    getTestSuites(): AzureTestSuite[] { return [...this.testSuites]; }
    saveTestCases(testCases: AzureTestCase[]): void { this.testCases = [...testCases]; }
    getTestCases(): AzureTestCase[] { return [...this.testCases]; }
    saveTestResults(results: AzureTestResult[]): void { this.testResults = [...results]; }
    getTestResults(): AzureTestResult[] { return [...this.testResults]; }
    saveIterations(iterations: AzureIteration[]): void { this.iterations = [...iterations]; }
    getIterations(): AzureIteration[] { return [...this.iterations]; }
    saveAreas(areas: AzureArea[]): void { this.areas = [...areas]; }
    getAreas(): AzureArea[] { return [...this.areas]; }

    clear(): void {
        this.connection = null;
        this.projects = [];
        this.repositories = [];
        this.workItems = [];
        this.bugs = [];
        this.testPlans = [];
        this.testSuites = [];
        this.testCases = [];
        this.testResults = [];
        this.iterations = [];
        this.areas = [];
    }
}

export const azureRepository = new AzureRepository();
