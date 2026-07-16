export interface AzureTestCase {
    id: number;
    title: string;
    state: string;
    url: string;
}

export interface AzureTestResult {
    id: number;
    testCaseId: number;
    outcome: string;
}
