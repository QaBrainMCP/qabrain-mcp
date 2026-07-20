export interface ComponentRecord {
    componentId: string;
    pageId: string;
    componentType: string;
    businessName?: string;
    normalizedName?: string;
    automationName?: string;
    description?: string;
    state?: string;
    confidence?: number;
    createdAt: string;
    lastValidated?: string;
}

export default ComponentRecord;
