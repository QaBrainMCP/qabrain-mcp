import { TestCase } from "../models/testcase.model.js";

export class TestCaseMemoryService {

    private testCases: TestCase[] = [];

    remember(testCase: TestCase) {

        this.testCases.push(testCase);

        return testCase;

    }

    getAll() {

        return this.testCases;

    }

}