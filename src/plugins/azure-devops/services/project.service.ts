import { AzureClient, azureClient } from "../client/azure.client.js";
import { AzureArea, AzureIteration, AzureProject, AzureRepositoryArtifact } from "../models/project.model.js";
import { AzureRepository, azureRepository } from "../repository/azure.repository.js";

export class ProjectService {
    constructor(
        private readonly client: AzureClient = azureClient,
        private readonly repository: AzureRepository = azureRepository
    ) {}

    async importProjects(): Promise<AzureProject[]> {
        const projects = (await this.client.listProjects()).map(project => ({
            id: project.id,
            name: project.name,
            description: project.description ?? null,
            url: project.url,
            state: project.state ?? "Unknown"
        }));
        this.repository.saveProjects(projects);
        return projects;
    }

    async importRepositories(project: string): Promise<AzureRepositoryArtifact[]> {
        const repositories = (await this.client.listRepositories(project)).map(repository => ({
            id: repository.id,
            name: repository.name,
            projectId: repository.project?.id ?? "",
            url: repository.webUrl ?? repository.url
        }));
        this.repository.saveRepositories(repositories);
        return repositories;
    }

    async importIterations(project: string): Promise<AzureIteration[]> {
        const iterations = await this.client.listIterations(project);
        this.repository.saveIterations(iterations);
        return iterations;
    }

    async importAreas(project: string): Promise<AzureArea[]> {
        const areas = await this.client.listAreas(project);
        this.repository.saveAreas(areas);
        return areas;
    }
}

export const projectService = new ProjectService();
