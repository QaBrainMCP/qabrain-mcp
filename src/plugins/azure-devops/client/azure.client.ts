export interface AzureClientConfiguration {
    organizationUrl: string;
    personalAccessToken: string;
}

export interface AzureProjectResponse {
    id: string;
    name: string;
    description?: string | null;
    url: string;
    state?: string;
}

export interface AzureRepositoryResponse {
    id: string;
    name: string;
    project?: { id?: string };
    webUrl?: string;
    url: string;
}

export interface AzureWorkItemResponse {
    id: number;
    url: string;
    fields?: Record<string, unknown>;
    relations?: Array<{ rel?: string; url?: string }>;
}

export interface AzureTestPlanResponse { id: number; name: string; state?: string; }
export interface AzureTestSuiteResponse { id: number; name: string; plan?: { id?: number }; }
export interface AzureTestCaseResponse { testCase?: { id?: number; name?: string; url?: string }; pointAssignments?: unknown[]; }
export interface AzureTestRunResponse { id: number; }
export interface AzureTestResultResponse { id: number; testCase?: { id?: number }; outcome?: string; }
export interface AzureIterationResponse { id: string; name: string; path: string; }
export interface AzureAreaResponse { id: number; name: string; path: string; }

interface AzureListResponse<T> { value?: T[]; }
interface AzureWiqlResponse { workItems?: Array<{ id: number }>; }

export class AzureClient {
    private configuration: AzureClientConfiguration | null = null;

    constructor(private readonly fetcher: typeof fetch = fetch) {}

    configure(configuration: AzureClientConfiguration): void {
        this.configuration = {
            organizationUrl: configuration.organizationUrl.replace(/\/$/, ""),
            personalAccessToken: configuration.personalAccessToken
        };
    }

    async listProjects(): Promise<AzureProjectResponse[]> {
        const response = await this.request<AzureListResponse<AzureProjectResponse>>("/_apis/projects?api-version=7.1");
        return response.value ?? [];
    }

    async listRepositories(project: string): Promise<AzureRepositoryResponse[]> {
        const response = await this.request<AzureListResponse<AzureRepositoryResponse>>(
            `/${encodeURIComponent(project)}/_apis/git/repositories?api-version=7.1`
        );
        return response.value ?? [];
    }

    async listIterations(project: string): Promise<AzureIterationResponse[]> {
        const response = await this.request<AzureListResponse<AzureIterationResponse>>(
            `/${encodeURIComponent(project)}/_apis/work/teamsettings/iterations?api-version=7.1`
        );
        return response.value ?? [];
    }

    async listAreas(project: string): Promise<AzureAreaResponse[]> {
        const response = await this.request<AzureAreaResponse>(
            `/${encodeURIComponent(project)}/_apis/wit/classificationnodes/areas?api-version=7.1`
        );
        return response ? [response] : [];
    }

    async listWorkItems(project: string): Promise<AzureWorkItemResponse[]> {
        const wiql = await this.request<AzureWiqlResponse>(
            `/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.1`,
            "POST",
            { query: "SELECT [System.Id] FROM WorkItems" }
        );
        const ids = wiql.workItems?.map(item => item.id) ?? [];
        if (ids.length === 0) return [];
        const response = await this.request<AzureListResponse<AzureWorkItemResponse>>(
            `/${encodeURIComponent(project)}/_apis/wit/workitems?ids=${ids.join(",")}&$expand=Relations&api-version=7.1`
        );
        return response.value ?? [];
    }

    async listTestPlans(project: string): Promise<AzureTestPlanResponse[]> {
        const response = await this.request<AzureListResponse<AzureTestPlanResponse>>(
            `/${encodeURIComponent(project)}/_apis/testplan/plans?api-version=7.1`
        );
        return response.value ?? [];
    }

    async listTestSuites(project: string, planId: number): Promise<AzureTestSuiteResponse[]> {
        const response = await this.request<AzureListResponse<AzureTestSuiteResponse>>(
            `/${encodeURIComponent(project)}/_apis/testplan/Plans/${planId}/suites?api-version=7.1`
        );
        return response.value ?? [];
    }

    async listTestCases(project: string, planId: number, suiteId: number): Promise<AzureTestCaseResponse[]> {
        const response = await this.request<AzureListResponse<AzureTestCaseResponse>>(
            `/${encodeURIComponent(project)}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=7.1`
        );
        return response.value ?? [];
    }

    async listTestResults(project: string): Promise<AzureTestResultResponse[]> {
        const runs = await this.request<AzureListResponse<AzureTestRunResponse>>(
            `/${encodeURIComponent(project)}/_apis/test/runs?api-version=7.1`
        );
        const results = await Promise.all((runs.value ?? []).map(async run => {
            const response = await this.request<AzureListResponse<AzureTestResultResponse>>(
                `/${encodeURIComponent(project)}/_apis/test/runs/${run.id}/results?api-version=7.1`
            );
            return response.value ?? [];
        }));
        return results.flat();
    }

    private async request<T>(path: string, method = "GET", body?: object): Promise<T> {
        if (!this.configuration) throw new Error("Azure DevOps client is not authenticated");
        const response = await this.fetcher(`${this.configuration.organizationUrl}${path}`, {
            method,
            headers: {
                Authorization: `Basic ${Buffer.from(`:${this.configuration.personalAccessToken}`).toString("base64")}`,
                Accept: "application/json",
                ...(body ? { "Content-Type": "application/json" } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            throw new Error(`Azure DevOps request failed with status ${response.status}`);
        }
        return await response.json() as T;
    }
}

export const azureClient = new AzureClient();
