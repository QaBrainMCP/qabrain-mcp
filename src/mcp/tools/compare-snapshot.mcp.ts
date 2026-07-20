import type { MCPTool } from "../registry/tool.registry.js";
import { logger } from "../../utils/logger.js";
import fs from "node:fs/promises";
import path from "node:path";

export interface CompareSnapshotInput { previousSnapshotId: string; currentSnapshotId: string }

export const CompareSnapshotTool: MCPTool<CompareSnapshotInput> = {
    name: "compare_snapshot",
    description: "Compare two snapshots and report changes",
    async execute(args: CompareSnapshotInput) {
        const start = Date.now();
        logger.info({ tool: "compare_snapshot" }, "MCP Tool compare_snapshot started");
        const dir = path.join(process.cwd(), ".qabrain", "snapshots");
        const prev = path.join(dir, `${args.previousSnapshotId}.json`);
        const curr = path.join(dir, `${args.currentSnapshotId}.json`);
        let prevData = null; let currData = null;
        try { prevData = JSON.parse(await fs.readFile(prev, "utf8")); } catch {}
        try { currData = JSON.parse(await fs.readFile(curr, "utf8")); } catch {}
        const changedComponents = [];
        const changedLocators = [];
        let riskScore = 0;
        if (prevData && currData) {
            // naive diff
            const prevComps = new Set(Object.keys(prevData.components ?? {}));
            const currComps = new Set(Object.keys(currData.components ?? {}));
            for (const c of currComps) if (!prevComps.has(c)) changedComponents.push(c);
            // locators
            const prevLoc = new Set(Object.keys(prevData.locators ?? {}));
            const currLoc = new Set(Object.keys(currData.locators ?? {}));
            for (const l of currLoc) if (!prevLoc.has(l)) changedLocators.push(l);
            riskScore = Math.min(100, changedComponents.length * 5 + changedLocators.length * 2);
        }
        const res = { status: "ok", message: "Snapshot comparison complete", data: { previous: prevData, current: currData, changedComponents, changedLocators, riskScore }, metadata: {}, executionTime: Date.now() - start };
        logger.info({ tool: "compare_snapshot", executionTime: res.executionTime }, "MCP Tool compare_snapshot completed");
        return res;
    }
};
