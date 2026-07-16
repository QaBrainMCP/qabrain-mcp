export interface AzureProject {
    id: string;
    name: string;
    description: string | null;
    url: string;
    state: string;
}

export interface AzureRepositoryArtifact {
    id: string;
    name: string;
    projectId: string;
    url: string;
}

export interface AzureConnection {
    organizationUrl: string;
    projectName: string;
    connectedAt: Date;
}

export interface AzureIteration {
    id: string;
    name: string;
    path: string;
}

export interface AzureArea {
    id: number;
    name: string;
    path: string;
}
