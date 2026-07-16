import { RiskLevel } from "../../impact/models/impact.model.js";
import { KnowledgeChange } from "./change.model.js";

export interface KnowledgeVersion {
    version: string;
    snapshotId: string;
    previousSnapshotId: string | null;
    changes: KnowledgeChange[];
    risk: RiskLevel;
    recommendations: string[];
    createdAt: Date;
}
