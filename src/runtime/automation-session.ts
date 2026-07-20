export interface AutomationSession {
    sessionId: string;
    application: string;
    feature?: string;
    repositoryVersion?: string | null;
    snapshotVersion?: string | null;
    createdAt: string;
    lastAccessed: string;
    knowledgeHealth?: string;
    cachedPages?: Record<string, unknown>;
    cachedComponents?: Record<string, unknown>;
    cachedNavigation?: unknown[];
    cachedVerification?: Record<string, unknown>;
    cachedMetadata?: Record<string, unknown>;
    repositoryHits?: number;
    cacheHits?: number;
}

export function makeSessionId(application: string, feature?: string) {
    return `${application.replace(/\s+/g, '_')}:${feature ?? 'feature'}:${Date.now().toString(36)}`;
}

export default AutomationSession;
