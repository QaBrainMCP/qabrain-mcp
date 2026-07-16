import { AzureClient, azureClient } from "../client/azure.client.js";
import { AzureConnection } from "../models/project.model.js";
import { AzureRepository, azureRepository } from "../repository/azure.repository.js";

export interface AzureAuthenticationInput {
    organizationUrl: string;
    projectName: string;
    personalAccessToken?: string;
}

export class AuthenticationService {
    constructor(
        private readonly client: AzureClient = azureClient,
        private readonly repository: AzureRepository = azureRepository
    ) {}

    connect(input: AzureAuthenticationInput): AzureConnection {
        const token = input.personalAccessToken ?? process.env.AZURE_DEVOPS_PAT;
        if (!token) throw new Error("Azure DevOps PAT must be provided or set as AZURE_DEVOPS_PAT");
        const organizationUrl = new URL(input.organizationUrl).toString().replace(/\/$/, "");
        this.client.configure({ organizationUrl, personalAccessToken: token });
        return this.repository.saveConnection({ organizationUrl, projectName: input.projectName, connectedAt: new Date() });
    }
}

export const authenticationService = new AuthenticationService();
