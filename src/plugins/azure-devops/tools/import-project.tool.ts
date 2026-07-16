import { projectService } from "../services/project.service.js";

export async function importProjects() {
    return projectService.importProjects();
}
