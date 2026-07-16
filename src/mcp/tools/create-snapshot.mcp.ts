import { CreateSnapshotInput, createSnapshot } from "../../versioning/tools/create-snapshot.tool.js";
import { MCPTool } from "../registry/tool.registry.js";

export const CreateSnapshotTool: MCPTool<CreateSnapshotInput> = {
    name: "create_snapshot",
    description: "Create an immutable snapshot of remembered application knowledge.",
    async execute(args: CreateSnapshotInput) {
        return createSnapshot(args);
    }
};
