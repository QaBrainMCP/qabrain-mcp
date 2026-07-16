import { diffService } from "../services/diff.service.js";
import { versionRepository } from "../repository/version.repository.js";

export interface CompareSnapshotsInput {
    previousSnapshotId: string;
    currentSnapshotId: string;
}

export async function compareSnapshots(input: CompareSnapshotsInput) {
    const previous = versionRepository.getSnapshot(input.previousSnapshotId);
    const current = versionRepository.getSnapshot(input.currentSnapshotId);
    if (!previous || !current) {
        throw new Error("Both snapshots must exist before comparison");
    }
    return diffService.compare(previous, current);
}
