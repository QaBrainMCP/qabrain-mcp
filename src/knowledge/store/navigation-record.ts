export interface NavigationRecord {
    fromPage: string;
    toPage: string;
    action?: string;
    component?: string | null;
    confidence?: number;
}

export default NavigationRecord;
