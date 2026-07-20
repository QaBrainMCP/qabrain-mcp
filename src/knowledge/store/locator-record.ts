export interface LocatorRecord {
    locatorId: string;
    componentId: string;
    strategy: string;
    locator: string;
    confidence?: number;
    validationStatus?: "VALIDATED" | "NOT_VALIDATED" | "CRITICAL";
    lastValidated?: string;
    timesValidated?: number;
    isPrimary?: boolean;
    alternatives?: string[];
}

export default LocatorRecord;
