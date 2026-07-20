export interface SessionContext {
    sessionId: string;
    application: string;
    feature?: string;
    cachedPages: Record<string, unknown>;
    cachedComponents: Record<string, unknown>;
    cachedNavigation: unknown[];
    cachedVerification: Record<string, unknown>;
    cachedMetadata: Record<string, unknown>;
}

export default SessionContext;
