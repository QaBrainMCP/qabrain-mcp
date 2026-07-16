import { synchronizationService } from "../services/synchronization.service.js";

export interface SynchronizeAzureInput { project: string; }

export async function synchronizeAzure(input: SynchronizeAzureInput) {
    return synchronizationService.synchronize(input.project);
}
