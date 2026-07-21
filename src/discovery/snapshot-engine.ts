import fs from "node:fs/promises";
import path from "node:path";
import { Page } from "playwright";
import { randomUUID } from "node:crypto";
import { SnapshotInfo } from "./types.js";

const SNAPSHOT_DIR = path.join(process.cwd(), ".qabrain", "snapshots");

export class SnapshotEngine {
    async capture(page: Page): Promise<SnapshotInfo> {
        await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
        const id = randomUUID();
        const fileBase = `${Date.now()}-${id}`;
        const screenshotPath = path.join(SNAPSHOT_DIR, `${fileBase}.png`);
        const domPath = path.join(SNAPSHOT_DIR, `${fileBase}.html`);

        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        const dom = await page.content().catch(() => "");
        await fs.writeFile(domPath, dom, "utf-8").catch(() => {});

        // accessibility snapshot may fail on some browsers
        let accessibility: any = null;
        try {
            accessibility = await (page as any).accessibility?.snapshot?.() ?? null;
        } catch {}

        return {
            id,
            pageUrl: page.url(),
            screenshot: screenshotPath,
            domPath,
            accessibility
        } as SnapshotInfo;
    }
}

export const snapshotEngine = new SnapshotEngine();
