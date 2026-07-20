import { knowledgeStoreService } from "../knowledge/store/knowledge-store.service.js";
import { snapshotService } from "../snapshot/services/snapshot.service.js";
import { automationSessionStore } from "./automation-session-store.js";
import AutomationSession, { makeSessionId } from "./automation-session.js";
import { pageSearchService } from "../services/repository/page-search.service.js";
import { logger } from "../utils/logger.js";

export class AutomationSessionManager {
    private sessions: Map<string, AutomationSession> = new Map();

    async startSession(opts: { application: string; feature?: string }) {
        const start = Date.now();
        await knowledgeStoreService.load();

        const repoMeta = (knowledgeStoreService as any).metadata ?? {};
        const latestSnapshot = snapshotService.getLatestSnapshot(opts.application ?? opts.feature ?? "application");

        const sessionId = makeSessionId(opts.application, opts.feature);

        // cache repository data
        const pages = (knowledgeStoreService as any).pages ?? {};
        const components = (knowledgeStoreService as any).components ?? {};
        const navigation = (knowledgeStoreService as any).navigation ?? [];

        // small verification map: pageId -> headings/labels
        const verification: Record<string, unknown> = {};
        for (const [pid, p] of Object.entries(pages)) {
            const comps = (p as any).components ?? [];
            const headings = comps.filter((cid: string) => {
                const c = (components as any)[cid];
                return c && ((c.componentType ?? '').toLowerCase().includes('heading') || /(title|heading)/i.test(c.businessName ?? ''));
            }).map((cid: string) => (components as any)[cid]?.businessName ?? cid);
            verification[pid] = { headings };
        }

        const session: AutomationSession = {
            sessionId,
            application: opts.application,
            feature: opts.feature,
            repositoryVersion: repoMeta.version ?? null,
            snapshotVersion: latestSnapshot?.version ?? null,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            knowledgeHealth: 'ok',
            cachedPages: pages,
            cachedComponents: components,
            cachedNavigation: navigation,
            cachedVerification: verification,
            cachedMetadata: repoMeta,
            repositoryHits: 0,
            cacheHits: 0
        };

        this.sessions.set(sessionId, session);
        await automationSessionStore.put(session);

        logger.info({ sessionId, application: opts.application, feature: opts.feature, durationMs: Date.now() - start }, "Session Started");

        return { sessionId };
    }

    async getSessionContext(sessionId: string) {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = await automationSessionStore.get(sessionId);
            if (!session) return null;
            this.sessions.set(sessionId, session);
        }

        session.lastAccessed = new Date().toISOString();
        session.cacheHits = (session.cacheHits ?? 0) + 1;
        await automationSessionStore.put(session);

        logger.info({ sessionId }, "Session Context Retrieved");
        return {
            sessionId: session.sessionId,
            application: session.application,
            feature: session.feature,
            cachedPages: session.cachedPages,
            cachedComponents: session.cachedComponents,
            cachedNavigation: session.cachedNavigation,
            cachedVerification: session.cachedVerification,
            cachedMetadata: session.cachedMetadata
        };
    }

    async refreshSession(sessionId: string) {
        const session = await automationSessionStore.get(sessionId);
        if (!session) return null;

        await knowledgeStoreService.load();
        const pages = (knowledgeStoreService as any).pages ?? {};
        const components = (knowledgeStoreService as any).components ?? {};
        const navigation = (knowledgeStoreService as any).navigation ?? [];

        session.cachedPages = pages;
        session.cachedComponents = components;
        session.cachedNavigation = navigation;
        session.lastAccessed = new Date().toISOString();
        session.repositoryVersion = (knowledgeStoreService as any).metadata?.version ?? session.repositoryVersion;

        await automationSessionStore.put(session);
        this.sessions.set(sessionId, session);

        logger.info({ sessionId }, "Session Refreshed");
        return { refreshed: true };
    }

    async closeSession(sessionId: string) {
        const start = Date.now();
        const session = await automationSessionStore.get(sessionId);
        if (!session) return { closed: false };

        const removed = await automationSessionStore.delete(sessionId);
        this.sessions.delete(sessionId);

        const durationMs = Date.now() - new Date(session.createdAt).getTime();
        const stats = {
            closed: true,
            sessionId,
            executionDurationMs: durationMs,
            repositoryHits: session.repositoryHits ?? 0,
            cacheHits: session.cacheHits ?? 0
        };

        logger.info({ sessionId, durationMs }, "Session Closed");
        return stats;
    }

    async listSessions() {
        const sessions = await automationSessionStore.list();
        return sessions.map(s => ({
            sessionId: s.sessionId,
            application: s.application,
            feature: s.feature,
            createdAt: s.createdAt,
            lastAccessed: s.lastAccessed,
            memoryUsageBytes: Buffer.byteLength(JSON.stringify(s), 'utf8')
        }));
    }
}

export const automationSessionManager = new AutomationSessionManager();
