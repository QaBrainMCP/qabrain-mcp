import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type AutomationSession from "./automation-session.js";

const ROOT = ".qabrain";
const FILE = "sessions.json";

async function ensureRoot() {
    await mkdir(ROOT, { recursive: true });
}

export class AutomationSessionStore {
    private sessions: Record<string, AutomationSession> = {};
    private loaded = false;

    private filePath() {
        return path.join(ROOT, FILE);
    }

    async load() {
        await ensureRoot();
        try {
            const raw = await readFile(this.filePath(), "utf8");
            this.sessions = JSON.parse(raw) ?? {};
        } catch {
            this.sessions = {};
            await this.save();
        }
        this.loaded = true;
        return this.sessions;
    }

    async save() {
        await ensureRoot();
        await writeFile(this.filePath(), JSON.stringify(this.sessions, null, 2), "utf8");
    }

    async get(sessionId: string) {
        if (!this.loaded) await this.load();
        return this.sessions[sessionId];
    }

    async put(session: AutomationSession) {
        if (!this.loaded) await this.load();
        this.sessions[session.sessionId] = session;
        await this.save();
    }

    async delete(sessionId: string) {
        if (!this.loaded) await this.load();
        const s = this.sessions[sessionId];
        delete this.sessions[sessionId];
        await this.save();
        return s;
    }

    async list() {
        if (!this.loaded) await this.load();
        return Object.values(this.sessions);
    }
}

export const automationSessionStore = new AutomationSessionStore();
