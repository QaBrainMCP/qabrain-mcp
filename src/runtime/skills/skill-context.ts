export interface SkillRequest {
    skill: string;
    sessionId: string;
    page: string;
    options?: Record<string, unknown>;
}

export default SkillRequest;
