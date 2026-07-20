import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";
import fs from "node:fs";
import path from "node:path";

export const RepositoryStatsTool: MCPTool = {
    name: "repository_stats",
    description: "Return repository statistics",
    async execute() {
        const start = Date.now();
        logger.info({ tool: "repository_stats" }, "MCP Tool repository_stats started");
        const apps = (knowledgeStoreService as any).applications ?? [];
        const pages = Object.keys((knowledgeStoreService as any).pages ?? {}).length;
        const components = Object.keys((knowledgeStoreService as any).components ?? {}).length;
        const locators = Object.keys((knowledgeStoreService as any).locators ?? {}).length;
        const snapshotsDir = path.join(process.cwd(), ".qabrain", "snapshots");
        let snapshots = 0;
        try { snapshots = fs.readdirSync(snapshotsDir).length; } catch {}
        let repoSize = 0;
        try {
            const files = fs.readdirSync(path.join(process.cwd(), ".qabrain"));
            for (const f of files) {
                try { const stat = fs.statSync(path.join(process.cwd(), ".qabrain", f)); repoSize += stat.size; } catch {}
            }
        } catch {}
        const metadata = (knowledgeStoreService as any).metadata ?? {};
        const data = { applications: apps.length ?? 0, pages, components, locators, snapshots, repositorySizeBytes: repoSize, lastUpdated: metadata.lastOpenedAt };
        const res = { status: "ok", message: "Repository stats", data, metadata: {}, executionTime: Date.now() - start };
        logger.info({ tool: "repository_stats", executionTime: res.executionTime }, "MCP Tool repository_stats completed");
        return res;
    }
};
