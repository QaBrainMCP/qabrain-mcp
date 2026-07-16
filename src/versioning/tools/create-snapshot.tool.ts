import { snapshotService } from "../services/snapshot.service.js";

export interface CreateSnapshotInput {
    application: string;
}

export async function createSnapshot(input: CreateSnapshotInput) {
    return snapshotService.create(input.application);
}
