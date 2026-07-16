import { CompareSnapshotsInput, compareSnapshots } from "../../versioning/tools/compare-snapshots.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const CompareSnapshotsTool: MCPTool<CompareSnapshotsInput> = {
    name: "compare_snapshots",
    description: "Compare two application-knowledge snapshots.",
    async execute(args: CompareSnapshotsInput) {
        return compareSnapshots(args);
    }
};
